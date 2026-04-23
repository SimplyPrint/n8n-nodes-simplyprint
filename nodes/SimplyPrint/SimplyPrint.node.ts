import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { simplyprintCall } from './common/client';
import { authenticationProperty, SIMPLYPRINT_CREDENTIALS } from './common/authSelector';
import { allProperties } from './descriptions';
import {
	loadPrinters,
	loadQueueGroups,
	loadFiles,
	loadQueueItems,
	loadFilaments,
	loadTags,
	loadCustomFields,
	searchPrinters,
	searchFiles,
	searchFilaments,
	searchQueueItems,
} from './common/dropdowns';
import { toSubmissionArray } from './common/customFields';
import { normalizeStartOptions } from './common/startOptions';
import {
	applySimplify,
	simplifyPrinter,
	simplifyQueueItem,
	simplifyQueueGroup,
	simplifyPrintHistory,
	simplifyTag,
} from './common/simplify';

/**
 * Read a resourceLocator value (or a plain options/number parameter) as a
 * number. `extractValue: true` unwraps the `{ __rl: true, mode, value }`
 * shape used by `type: 'resourceLocator'` parameters.
 */
function getIdParam(ctx: IExecuteFunctions, name: string, itemIndex: number): number {
	const raw = ctx.getNodeParameter(name, itemIndex, '', { extractValue: true }) as
		| string
		| number;
	const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
	if (!Number.isFinite(n) || n <= 0) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Parameter "${name}" must resolve to a positive integer (got ${JSON.stringify(raw)})`,
			{ itemIndex },
		);
	}
	return n;
}

function getFileIdParam(ctx: IExecuteFunctions, name: string, itemIndex: number): string {
	const raw = ctx.getNodeParameter(name, itemIndex, '', { extractValue: true }) as
		| string
		| number;
	const asString = String(raw ?? '').trim();
	if (!asString) {
		throw new NodeOperationError(ctx.getNode(), `Parameter "${name}" is required`, { itemIndex });
	}
	return asString;
}

export class SimplyPrint implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SimplyPrint',
		name: 'simplyPrint',
		icon: 'file:simplyprint.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Monitor and control SimplyPrint print farms - printers, queue, files, filament',
		defaults: { name: 'SimplyPrint' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: SIMPLYPRINT_CREDENTIALS,
		properties: [authenticationProperty, ...allProperties],
	};

	methods = {
		loadOptions: {
			loadPrinters,
			loadQueueGroups,
			loadFiles,
			loadQueueItems,
			loadFilaments,
			loadTags,
			loadCustomFields,
		},
		listSearch: {
			searchPrinters,
			searchFiles,
			searchFilaments,
			searchQueueItems,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let result: IDataObject | IDataObject[] | unknown;

				// -------------------- printer --------------------
				if (resource === 'printer') {
					if (operation === 'getAll') {
						const simplify = this.getNodeParameter('simplify', i, true) as boolean;
						const res = await simplyprintCall(this, { method: 'GET', path: 'printers/Get' });
						const raw = (res.objects ?? res) as IDataObject | IDataObject[];
						result = applySimplify(raw, simplify, simplifyPrinter);
					} else if (operation === 'get') {
						const simplify = this.getNodeParameter('simplify', i, true) as boolean;
						const printerId = getIdParam(this, 'printerId', i);
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'printers/Get',
							qs: { pid: printerId },
						});
						const raw = (res.objects ?? res) as IDataObject | IDataObject[];
						result = applySimplify(raw, simplify, simplifyPrinter);
					} else if (operation === 'pause' || operation === 'resume' || operation === 'cancel') {
						const printerId = getIdParam(this, 'printerId', i);
						const actionPath = { pause: 'Pause', resume: 'Resume', cancel: 'Cancel' }[operation];
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: `printers/actions/${actionPath}`,
							qs: { pid: printerId },
						});
						result = res;
					} else if (operation === 'sendGcode') {
						const printerId = getIdParam(this, 'printerId', i);
						const gcode = String(this.getNodeParameter('gcode', i, '') as string);
						const lines = gcode.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'printers/actions/SendGcode',
							qs: { pid: printerId },
							body: { gcode: lines },
						});
						result = res;
					}
				}

				// -------------------- queue --------------------
				else if (resource === 'queue') {
					if (operation === 'getAll') {
						const simplify = this.getNodeParameter('simplify', i, true) as boolean;
						const groupId = this.getNodeParameter('groupId', i, 0) as number;
						const includeDone = this.getNodeParameter('includeDone', i, false) as boolean;
						const qs: IDataObject = {};
						if (groupId) qs.group = groupId;
						if (includeDone) qs.include_done = 1;
						const res = await simplyprintCall(this, { method: 'GET', path: 'queue/GetItems', qs });
						const raw = (res.objects ?? res) as IDataObject | IDataObject[];
						result = applySimplify(raw, simplify, simplifyQueueItem);
					} else if (operation === 'getAllGroups') {
						const simplify = this.getNodeParameter('simplify', i, true) as boolean;
						const res = await simplyprintCall(this, { method: 'GET', path: 'queue/GetQueueGroups' });
						const raw = (res.objects ?? res) as IDataObject | IDataObject[];
						result = applySimplify(raw, simplify, simplifyQueueGroup);
					} else if (operation === 'addItem') {
						const fileId = getIdParam(this, 'fileId', i);
						const groupId = this.getNodeParameter('groupId', i, 0) as number;
						const amount = this.getNodeParameter('amount', i, 1) as number;
						const position = this.getNodeParameter('position', i, 'bottom') as string;
						const customFieldsRaw = this.getNodeParameter('customFields', i, {}) as IDataObject;
						const customFields = toSubmissionArray(customFieldsRaw);
						const body: IDataObject = { file_id: fileId, amount, position };
						if (groupId) body.group_id = groupId;
						if (customFields.length > 0) body.custom_fields = customFields;
						const res = await simplyprintCall(this, { method: 'POST', path: 'queue/AddItem', body });
						result = res;
					} else if (operation === 'updateItem') {
						const queueItemId = getIdParam(this, 'queueItemId', i);
						const amount = this.getNodeParameter('amount', i, 1) as number;
						const note = this.getNodeParameter('note', i, '') as string;
						const body: IDataObject = { job: queueItemId, amount };
						if (note) body.note = note;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'queue/UpdateItem',
							body,
						});
						result = res;
					} else if (operation === 'moveItem') {
						const queueItemId = getIdParam(this, 'queueItemId', i);
						const toPosition = this.getNodeParameter('toPosition', i) as number;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'queue/MoveItem',
							body: { job: queueItemId, to: toPosition },
						});
						result = res;
					} else if (operation === 'removeItem') {
						const queueItemId = getIdParam(this, 'queueItemId', i);
						await simplyprintCall(this, {
							method: 'POST',
							path: 'queue/RemoveItem',
							body: { job: queueItemId },
						});
						result = { deleted: true };
					} else if (operation === 'reviveItem') {
						const queueItemId = getIdParam(this, 'queueItemId', i);
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'queue/ReviveItem',
							body: { job: queueItemId },
						});
						result = res;
					} else if (operation === 'empty') {
						const groupId = this.getNodeParameter('groupId', i, 0) as number;
						const includeDone = this.getNodeParameter('includeDone', i, false) as boolean;
						const body: IDataObject = {};
						if (groupId) body.group_id = groupId;
						if (includeDone) body.include_done = true;
						await simplyprintCall(this, {
							method: 'POST',
							path: 'queue/EmptyQueue',
							body,
						});
						result = { deleted: true };
					} else if (operation === 'getAllPending') {
						const simplify = this.getNodeParameter('simplify', i, true) as boolean;
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'queue/approval/GetPendingItems',
						});
						const raw = (res.objects ?? res) as IDataObject | IDataObject[];
						result = applySimplify(raw, simplify, simplifyQueueItem);
					} else if (operation === 'approveItem' || operation === 'denyItem') {
						const ids = String(this.getNodeParameter('queueItemIds', i) as string)
							.split(',')
							.map((s) => Number(s.trim()))
							.filter((n) => Number.isFinite(n) && n > 0);
						const comment = this.getNodeParameter('comment', i, '') as string;
						const endpoint = operation === 'approveItem' ? 'ApproveItem' : 'DenyItem';
						const body: IDataObject = { jobs: ids };
						if (comment) body.comment = comment;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: `queue/approval/${endpoint}`,
							body,
						});
						result = res;
					}
				}

				// -------------------- file --------------------
				else if (resource === 'file') {
					if (operation === 'getAll') {
						const folderId = this.getNodeParameter('folderId', i, 0) as number;
						const qs: IDataObject = {};
						if (folderId) qs.folder_id = folderId;
						const res = await simplyprintCall(this, { method: 'GET', path: 'files/Get', qs });
						result = res.objects ?? res;
					} else if (operation === 'get') {
						const fileId = getIdParam(this, 'fileId', i);
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'files/Get',
							qs: { fid: fileId },
						});
						result = res.objects ?? res;
					} else if (operation === 'upload') {
						// Upload via files.simplyprint.io (the integration-reachable
						// file upload service). Returns a string hex file id usable as
						// `fileId` on queue/AddItem or `file_id` on CreateJob.
						const binaryPropertyName = this.getNodeParameter(
							'binaryPropertyName',
							i,
							'data',
						) as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						const formData: IDataObject = {
							file: {
								value: buffer,
								options: {
									filename: binaryData.fileName ?? 'upload',
									contentType: binaryData.mimeType,
								},
							},
						};
						const res = await simplyprintCall<{
							file?: { id?: string; name?: string; size?: number; expires_at?: string };
						}>(this, {
							method: 'POST',
							path: 'files/Upload',
							formData,
							baseUrlOverride: 'https://files.simplyprint.io',
						});
						const file = (res as IDataObject).file as IDataObject | undefined;
						const fileId = String(file?.id ?? '');
						if (!fileId) {
							throw new NodeOperationError(
								this.getNode(),
								'files/Upload did not return a file id',
								{ itemIndex: i },
							);
						}
						result = {
							fileId,
							name: file?.name,
							size: file?.size,
							expires_at: file?.expires_at,
							raw: res,
						};
					} else if (operation === 'uploadAndQueue') {
						const binaryPropertyName = this.getNodeParameter(
							'binaryPropertyName',
							i,
							'data',
						) as string;
						const queueGroupId = this.getNodeParameter('queueGroupId', i, 0) as number;
						const amount = this.getNodeParameter('amount', i, 1) as number;
						const position = this.getNodeParameter('position', i, 'bottom') as string;
						const queueCustomFieldsRaw = this.getNodeParameter(
							'queueCustomFields',
							i,
							{},
						) as IDataObject;
						const queueCustomFields = toSubmissionArray(queueCustomFieldsRaw);
						const printCustomFieldsRaw = this.getNodeParameter(
							'printCustomFields',
							i,
							{},
						) as IDataObject;
						const printCustomFields = toSubmissionArray(printCustomFieldsRaw);
						const startOnPrinterIdsRaw = this.getNodeParameter(
							'startOnPrinterIds',
							i,
							'',
						) as string;
						const startPrinterIds = startOnPrinterIdsRaw
							.split(',')
							.map((s) => Number(s.trim()))
							.filter((n) => Number.isFinite(n) && n > 0);
						const startOptionsRaw = this.getNodeParameter('startOptions', i, '{}') as
							| IDataObject
							| string;
						const startOptions = normalizeStartOptions(startOptionsRaw);

						if (!queueGroupId || queueGroupId <= 0) {
							throw new NodeOperationError(
								this.getNode(),
								'file.uploadAndQueue requires a Queue Group ID',
								{ itemIndex: i },
							);
						}

						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

						// Step 1: upload to files.simplyprint.io.
						const uploadRes = await simplyprintCall<{ file?: { id?: string } }>(this, {
							method: 'POST',
							path: 'files/Upload',
							formData: {
								file: {
									value: buffer,
									options: {
										filename: binaryData.fileName ?? 'upload',
										contentType: binaryData.mimeType,
									},
								},
							},
							baseUrlOverride: 'https://files.simplyprint.io',
						});
						const uploadedFileId = String(
							(uploadRes as IDataObject).file
								? (((uploadRes as IDataObject).file as IDataObject).id ?? '')
								: '',
						);
						if (!uploadedFileId) {
							throw new NodeOperationError(
								this.getNode(),
								'files/Upload did not return a file id',
								{ itemIndex: i },
							);
						}

						// Step 2: add to queue using the API file id.
						const addBody: IDataObject = {
							fileId: uploadedFileId,
							group: queueGroupId,
							amount,
							position,
						};
						if (queueCustomFields.length > 0)
							addBody.custom_fields = queueCustomFields as unknown as IDataObject[];
						const addRes = await simplyprintCall<{ created_id?: number; id?: number }>(this, {
							method: 'POST',
							path: 'queue/AddItem',
							body: addBody,
						});
						const queueItemRaw = (addRes ?? {}) as IDataObject;
						const queueObjects = (queueItemRaw.objects ?? {}) as IDataObject;
						const queueItemId = Number(
							queueItemRaw.created_id ??
								queueObjects.created_id ??
								queueObjects.id ??
								0,
						);

						// Step 3 (optional): start print on printers.
						let startRes: unknown = null;
						if (startPrinterIds.length > 0) {
							const jobBody: IDataObject = {};
							if (queueItemId > 0) {
								jobBody.queue_file = queueItemId;
							} else {
								jobBody.file_id = uploadedFileId;
							}
							if (printCustomFields.length > 0) {
								jobBody.custom_fields = printCustomFields as unknown as IDataObject[];
							}
							if (startOptions) jobBody.start_options = startOptions;
							startRes = await simplyprintCall(this, {
								method: 'POST',
								path: 'printers/actions/CreateJob',
								qs: { pid: startPrinterIds.join(',') },
								body: jobBody,
							});
						}

						result = {
							fileId: uploadedFileId,
							queueItemId: queueItemId || null,
							jobs: startRes,
							queue: addRes,
							upload: uploadRes,
						};
					} else if (operation === 'move') {
						const fileId = getIdParam(this, 'fileId', i);
						const folderId = this.getNodeParameter('folderId', i, 0) as number;
						const body: IDataObject = { id: fileId };
						if (folderId) body.folder_id = folderId;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'files/Move',
							body,
						});
						result = res;
					} else if (operation === 'delete') {
						const fileId = getIdParam(this, 'fileId', i);
						await simplyprintCall(this, {
							method: 'POST',
							path: 'files/Delete',
							body: { id: fileId },
						});
						result = { deleted: true };
					}
				}

				// -------------------- filament --------------------
				else if (resource === 'filament') {
					if (operation === 'getAll') {
						const res = await simplyprintCall(this, { method: 'GET', path: 'filament/Get' });
						result = res.objects ?? res;
					} else if (operation === 'get') {
						const filamentId = getIdParam(this, 'filamentId', i);
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'filament/Get',
							qs: { fid: filamentId },
						});
						result = res.objects ?? res;
					} else if (operation === 'assign' || operation === 'unassign') {
						const filamentId = getIdParam(this, 'filamentId', i);
						const printerId = getIdParam(this, 'printerId', i);
						const endpoint = operation === 'assign' ? 'Assign' : 'Unassign';
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: `filament/${endpoint}`,
							body: { pid: printerId, fid: filamentId },
						});
						result = res;
					}
				}

				// -------------------- organization --------------------
				else if (resource === 'organization') {
					if (operation === 'getCurrentUser') {
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: '0/account/GetUser',
							company: 0,
						});
						result = res;
					} else if (operation === 'getStatistics') {
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'account/GetStatistics',
						});
						result = res.objects ?? res;
					} else if (operation === 'getAllPrintHistory') {
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'print_history/Get',
						});
						const raw = (res.objects ?? res) as IDataObject | IDataObject[];
						result = applySimplify(raw, true, simplifyPrintHistory);
					} else if (operation === 'getAllTags') {
						const res = await simplyprintCall(this, { method: 'GET', path: 'tags/Get' });
						const raw = (res.objects ?? res) as IDataObject | IDataObject[];
						result = applySimplify(raw, true, simplifyTag);
					}
				}

				// -------------------- customField --------------------
				else if (resource === 'customField') {
					if (operation === 'getAll') {
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'custom_fields/Get',
						});
						result = res.objects ?? res;
					} else if (operation === 'setValues') {
						const category = this.getNodeParameter('category', i, 'print') as string;
						const subCategory = this.getNodeParameter('subCategory', i, '') as string;
						const entityIds = String(this.getNodeParameter('entityIds', i) as string)
							.split(',')
							.map((s) => Number(s.trim()))
							.filter((n) => Number.isFinite(n) && n > 0);
						const valuesRaw = this.getNodeParameter('customFields', i, {}) as IDataObject;
						let values = toSubmissionArray(valuesRaw);

						// Back-compat shim: older flows saved a single `customFieldId` +
						// `value` (+ maybe `type`) rather than a fixedCollection. Synthesize
						// a one-entry array so they keep working.
						if (values.length === 0) {
							const legacyId = this.getNodeParameter('customFieldId', i, '') as string;
							const legacyValue = this.getNodeParameter('value', i, '') as string;
							if (legacyId) {
								values = toSubmissionArray({
									value: [{ customFieldId: String(legacyId), type: 'text', value: legacyValue }],
								} as IDataObject);
							}
						}

						const body: IDataObject = {
							category,
							entityIds,
							values: values as unknown as IDataObject[],
						};
						if (subCategory) body.subCategory = subCategory;

						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'custom_fields/SubmitValues',
							body,
						});
						result = res;
					}
				}

				// -------------------- printJob --------------------
				else if (resource === 'printJob') {
					if (operation === 'create') {
						const printerIdsRaw = this.getNodeParameter('printerIds', i) as string;
						const printerIds = printerIdsRaw
							.split(',')
							.map((s) => Number(s.trim()))
							.filter((n) => Number.isFinite(n) && n > 0);
						if (printerIds.length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'printJob.create requires at least one printer ID',
								{ itemIndex: i },
							);
						}
						const fileSource = this.getNodeParameter('fileSource', i, 'userFile') as string;
						const sharedRaw = this.getNodeParameter('customFields', i, {}) as IDataObject;
						const sharedCustomFields = toSubmissionArray(sharedRaw);
						const individualRaw = this.getNodeParameter('individualCustomFields', i, '[]') as
							| string
							| IDataObject
							| unknown[];
						const startOptionsRaw = this.getNodeParameter('startOptions', i, '{}') as
							| string
							| IDataObject;
						const mmsMapRaw = this.getNodeParameter('mmsMap', i, '{}') as string | IDataObject;

						const body: IDataObject = {};

						if (fileSource === 'userFile') {
							const fileId = getFileIdParam(this, 'fileId', i);
							body.filesystem = fileId;
						} else if (fileSource === 'queueItem') {
							const queueItemId = getIdParam(this, 'queueItemId', i);
							body.queue_file = queueItemId;
						}

						if (sharedCustomFields.length > 0) {
							body.custom_fields = sharedCustomFields as unknown as IDataObject[];
						}

						let individual: unknown = individualRaw;
						if (typeof individual === 'string') {
							const trimmed = individual.trim();
							if (trimmed.length > 0) {
								try {
									individual = JSON.parse(trimmed);
								} catch {
									throw new NodeOperationError(
										this.getNode(),
										'individualCustomFields is not valid JSON',
										{ itemIndex: i },
									);
								}
							} else {
								individual = [];
							}
						}
						if (Array.isArray(individual) && individual.length > 0) {
							body.individual_custom_fields = individual as IDataObject[];
						}

						const startOptions = normalizeStartOptions(startOptionsRaw);
						if (startOptions) body.start_options = startOptions;

						let mmsMap: unknown = mmsMapRaw;
						if (typeof mmsMap === 'string') {
							const trimmed = mmsMap.trim();
							if (trimmed.length > 0) {
								try {
									mmsMap = JSON.parse(trimmed);
								} catch {
									throw new NodeOperationError(
										this.getNode(),
										'mmsMap is not valid JSON',
										{ itemIndex: i },
									);
								}
							} else {
								mmsMap = {};
							}
						}
						if (
							mmsMap &&
							typeof mmsMap === 'object' &&
							Object.keys(mmsMap as IDataObject).length > 0
						) {
							body.mms_map = mmsMap as IDataObject;
						}

						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'printers/actions/CreateJob',
							qs: { pid: printerIds.join(',') },
							body,
						});
						result = res;
					}
				}

				// -------------------- webhook --------------------
				else if (resource === 'webhook') {
					if (operation === 'triggerTest') {
						const webhookId = this.getNodeParameter('webhookId', i) as number;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'webhooks/TriggerTestWebhook',
							body: { id: webhookId },
						});
						result = res;
					}
				}

				// -------------------- customApiCall (escape hatch) --------------------
				else if (resource === 'customApiCall') {
					const method = this.getNodeParameter('method', i) as IHttpRequestMethods;
					const path = String(this.getNodeParameter('path', i) as string).replace(/^\/+/, '');
					const qsRaw = this.getNodeParameter('queryParams', i, {}) as IDataObject | string;
					const bodyRaw = this.getNodeParameter('body', i, {}) as IDataObject | string;
					const useCompany = this.getNodeParameter('useCompany', i, true) as boolean;

					const qs =
						typeof qsRaw === 'string' ? (JSON.parse(qsRaw || '{}') as IDataObject) : qsRaw;
					const body =
						typeof bodyRaw === 'string'
							? (JSON.parse(bodyRaw || '{}') as IDataObject)
							: bodyRaw;

					const res = await simplyprintCall(this, {
						method,
						path,
						qs: Object.keys(qs).length ? qs : undefined,
						body: method === 'GET' || Object.keys(body).length === 0 ? undefined : body,
						company: useCompany ? undefined : 0,
					});
					result = res;
				}

				// Flatten array results into one item per row, objects as a single item.
				if (Array.isArray(result)) {
					for (const row of result) {
						returnData.push({ json: row as IDataObject, pairedItem: { item: i } });
					}
				} else {
					returnData.push({ json: (result ?? {}) as IDataObject, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
