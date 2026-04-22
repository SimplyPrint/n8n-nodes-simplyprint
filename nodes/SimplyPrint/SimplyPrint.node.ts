import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
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
} from './common/dropdowns';

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
					if (operation === 'list') {
						const res = await simplyprintCall(this, { method: 'GET', path: 'printers/Get' });
						result = res.objects ?? res;
					} else if (operation === 'get') {
						const printerId = this.getNodeParameter('printerId', i) as number;
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'printers/Get',
							qs: { pid: printerId },
						});
						result = res.objects ?? res;
					} else if (operation === 'pause' || operation === 'resume' || operation === 'cancel') {
						const printerId = this.getNodeParameter('printerId', i) as number;
						const actionPath = { pause: 'Pause', resume: 'Resume', cancel: 'Cancel' }[operation];
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: `printers/actions/${actionPath}`,
							qs: { pid: printerId },
						});
						result = res;
					} else if (operation === 'sendGcode') {
						const printerId = this.getNodeParameter('printerId', i) as number;
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
					if (operation === 'listItems') {
						const groupId = this.getNodeParameter('groupId', i, 0) as number;
						const includeDone = this.getNodeParameter('includeDone', i, false) as boolean;
						const qs: IDataObject = {};
						if (groupId) qs.group = groupId;
						if (includeDone) qs.include_done = 1;
						const res = await simplyprintCall(this, { method: 'GET', path: 'queue/GetItems', qs });
						result = res.objects ?? res;
					} else if (operation === 'listGroups') {
						const res = await simplyprintCall(this, { method: 'GET', path: 'queue/GetQueueGroups' });
						result = res.objects ?? res;
					} else if (operation === 'addItem') {
						const fileId = this.getNodeParameter('fileId', i) as number;
						const groupId = this.getNodeParameter('groupId', i, 0) as number;
						const amount = this.getNodeParameter('amount', i, 1) as number;
						const position = this.getNodeParameter('position', i, 'bottom') as string;
						const body: IDataObject = { file_id: fileId, amount, position };
						if (groupId) body.group_id = groupId;
						const res = await simplyprintCall(this, { method: 'POST', path: 'queue/AddItem', body });
						result = res;
					} else if (operation === 'updateItem') {
						const queueItemId = this.getNodeParameter('queueItemId', i) as number;
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
						const queueItemId = this.getNodeParameter('queueItemId', i) as number;
						const toPosition = this.getNodeParameter('toPosition', i) as number;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'queue/MoveItem',
							body: { job: queueItemId, to: toPosition },
						});
						result = res;
					} else if (operation === 'removeItem') {
						const queueItemId = this.getNodeParameter('queueItemId', i) as number;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'queue/RemoveItem',
							body: { job: queueItemId },
						});
						result = res;
					} else if (operation === 'reviveItem') {
						const queueItemId = this.getNodeParameter('queueItemId', i) as number;
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
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'queue/EmptyQueue',
							body,
						});
						result = res;
					} else if (operation === 'listPending') {
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'queue/approval/GetPendingItems',
						});
						result = res.objects ?? res;
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
					if (operation === 'list') {
						const folderId = this.getNodeParameter('folderId', i, 0) as number;
						const qs: IDataObject = {};
						if (folderId) qs.folder_id = folderId;
						const res = await simplyprintCall(this, { method: 'GET', path: 'files/Get', qs });
						result = res.objects ?? res;
					} else if (operation === 'get') {
						const fileId = this.getNodeParameter('fileId', i) as number;
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'files/Get',
							qs: { fid: fileId },
						});
						result = res.objects ?? res;
					} else if (operation === 'upload') {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
						const folderId = this.getNodeParameter('folderId', i, 0) as number;
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
						if (folderId) formData.folder_id = folderId;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'files/Upload',
							formData,
						});
						result = res;
					} else if (operation === 'move') {
						const fileId = this.getNodeParameter('fileId', i) as number;
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
						const fileId = this.getNodeParameter('fileId', i) as number;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'files/Delete',
							body: { id: fileId },
						});
						result = res;
					}
				}

				// -------------------- filament --------------------
				else if (resource === 'filament') {
					if (operation === 'list') {
						const res = await simplyprintCall(this, { method: 'GET', path: 'filament/Get' });
						result = res.objects ?? res;
					} else if (operation === 'get') {
						const filamentId = this.getNodeParameter('filamentId', i) as number;
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'filament/Get',
							qs: { fid: filamentId },
						});
						result = res.objects ?? res;
					} else if (operation === 'assign' || operation === 'unassign') {
						const filamentId = this.getNodeParameter('filamentId', i) as number;
						const printerId = this.getNodeParameter('printerId', i) as number;
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
					} else if (operation === 'listPrintHistory') {
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'print_history/Get',
						});
						result = res.objects ?? res;
					} else if (operation === 'listTags') {
						const res = await simplyprintCall(this, { method: 'GET', path: 'tags/Get' });
						result = res.objects ?? res;
					}
				}

				// -------------------- customField --------------------
				else if (resource === 'customField') {
					if (operation === 'list') {
						const res = await simplyprintCall(this, {
							method: 'GET',
							path: 'custom_fields/Get',
						});
						result = res.objects ?? res;
					} else if (operation === 'setValues') {
						const customFieldId = this.getNodeParameter('customFieldId', i) as number;
						const entity = this.getNodeParameter('entity', i) as string;
						const entityIds = String(this.getNodeParameter('entityIds', i) as string)
							.split(',')
							.map((s) => Number(s.trim()))
							.filter((n) => Number.isFinite(n) && n > 0);
						const value = this.getNodeParameter('value', i, '') as string;
						const res = await simplyprintCall(this, {
							method: 'POST',
							path: 'custom_fields/SetValues',
							body: { field_id: customFieldId, entity, entity_ids: entityIds, value },
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
