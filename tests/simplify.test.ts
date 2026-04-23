import { describe, it, expect } from 'vitest';

import {
	applySimplify,
	simplifyPrinter,
	simplifyQueueItem,
	simplifyQueueGroup,
	simplifyPrintHistory,
	simplifyTag,
} from '../nodes/SimplyPrint/common/simplify';

describe('simplifyPrinter', () => {
	it('keeps at most 10 fields on the output', () => {
		const raw = {
			id: 42,
			name: 'Voron 2.4',
			model: 'Voron 2.4 300',
			state: 'printing',
			online: true,
			temperatures: { tool0: 215, bed: 60 },
			last_seen: '2026-04-23T10:00:00Z',
			job: { progress: 42.5, file_name: 'bracket.gcode', time_left: 1800 },
			// Fields that must NOT leak through:
			slicer: 'PrusaSlicer',
			mac: 'aa:bb:cc:dd:ee:ff',
			owner_id: 17,
			group_ids: [1, 2],
			webcam_url: 'https://...',
			extra_field: 'noise',
		} as unknown as Parameters<typeof simplifyPrinter>[0];
		const out = simplifyPrinter(raw);
		expect(Object.keys(out).length).toBeLessThanOrEqual(10);
		expect(out.id).toBe(42);
		expect(out.state).toBe('printing');
		expect(out.progress).toBe(42.5);
		expect(out.currentFile).toBe('bracket.gcode');
		expect('slicer' in out).toBe(false);
		expect('mac' in out).toBe(false);
	});

	it('falls back to top-level fields when current_job is absent', () => {
		const raw = {
			id: 3,
			name: 'Old P1S',
			state: 'idle',
			progress: 0,
			current_file: null,
		};
		const out = simplifyPrinter(raw);
		expect(out.progress).toBe(0);
		expect(out.currentFile).toBeNull();
	});
});

describe('simplifyQueueItem', () => {
	it('picks the queue-item-shape subset', () => {
		const raw = {
			id: 8821,
			file_id: 'abc123',
			file_name: 'spool.gcode',
			group_id: 4,
			amount: 2,
			done: false,
			position: 7,
			note: 'needs tree supports',
			created_at: '2026-04-23T09:00:00Z',
			status: 'pending',
			debug: 'should not leak',
			internal: true,
		};
		const out = simplifyQueueItem(raw);
		expect(out).toEqual({
			id: 8821,
			file_id: 'abc123',
			file_name: 'spool.gcode',
			group_id: 4,
			amount: 2,
			done: false,
			position: 7,
			note: 'needs tree supports',
			created_at: '2026-04-23T09:00:00Z',
			status: 'pending',
		});
		expect('debug' in out).toBe(false);
	});

	it('omits fields that are undefined on the input (no noisy undefined keys)', () => {
		const out = simplifyQueueItem({ id: 1, file_name: 'x' });
		expect('amount' in out).toBe(false);
		expect('debug' in out).toBe(false);
	});
});

describe('applySimplify', () => {
	it('passes through when simplify is false', () => {
		const raw = { id: 1, name: 'x', slicer: 'y' };
		expect(applySimplify(raw, false, simplifyTag)).toBe(raw);
	});

	it('maps each element when given an array', () => {
		const raw = [
			{ id: 1, name: 'red', color: '#f00', extra: 'a' },
			{ id: 2, name: 'blue', color: '#00f', extra: 'b' },
		];
		const out = applySimplify(raw, true, simplifyTag) as Array<{ extra?: string }>;
		expect(Array.isArray(out)).toBe(true);
		expect(out).toHaveLength(2);
		for (const row of out) {
			expect('extra' in row).toBe(false);
		}
	});

	it('simplifies history rows consistently', () => {
		const out = simplifyPrintHistory({
			id: 11,
			file_name: 'part.gcode',
			printer_id: 3,
			started_at: 't0',
			ended_at: 't1',
			duration: 3600,
			status: 'done',
			filament_used: 12.3,
			user_id: 4,
			group_id: 1,
			ignored: 'drop me',
		});
		expect('ignored' in out).toBe(false);
		expect(Object.keys(out).length).toBeLessThanOrEqual(10);
	});

	it('keeps queue-group shape minimal', () => {
		const out = simplifyQueueGroup({
			id: 1,
			name: 'Fleet A',
			description: 'all voron printers',
			default: true,
			items_count: 4,
			printer_ids: [1, 2, 3],
			extra: 'drop',
		});
		expect('extra' in out).toBe(false);
		expect(out.printer_ids).toEqual([1, 2, 3]);
	});
});
