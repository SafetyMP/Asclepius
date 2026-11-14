import { describe, expect, it } from 'vitest';
import taskFixture from '../../../../tests/fixtures/handoff-task.json';
import requestFixture from '../../../../tests/fixtures/referral-request.json';
import { parseResource, resourceUnion } from '../union';
import { serviceRequest } from './service-request';
import { task, taskParameter } from './task';

describe('referral teaching resources', () => {
  it('preserves the request, ownership, and planned-visit links through canonical parsing', () => {
    expect(parseResource(requestFixture)).toEqual(requestFixture);
    expect(parseResource(taskFixture)).toEqual(taskFixture);
    expect(resourceUnion.parse(requestFixture).resourceType).toBe('ServiceRequest');
    expect(resourceUnion.parse(taskFixture).resourceType).toBe('Task');
  });

  it.each(['status', 'intent', 'subject'])('requires ServiceRequest.%s', (field) => {
    const candidate: Record<string, unknown> = { ...requestFixture };
    delete candidate[field];
    expect(serviceRequest.safeParse(candidate).success).toBe(false);
  });

  it.each(['status', 'intent'])('requires Task.%s', (field) => {
    const candidate: Record<string, unknown> = { ...taskFixture };
    delete candidate[field];
    expect(task.safeParse(candidate).success).toBe(false);
  });

  it('rejects invalid status and malformed reference values', () => {
    expect(serviceRequest.safeParse({ ...requestFixture, status: 'accepted' }).success).toBe(false);
    expect(task.safeParse({ ...taskFixture, status: 'active' }).success).toBe(false);
    expect(task.safeParse({ ...taskFixture, owner: { reference: 123 } }).success).toBe(false);
    expect(serviceRequest.safeParse({ ...requestFixture, subject: 'Patient/x' }).success).toBe(
      false,
    );
  });

  it('rejects conflicting occurrence choices and order details without a code', () => {
    expect(
      serviceRequest.safeParse({
        ...requestFixture,
        occurrenceDateTime: '2026-11-14',
        occurrencePeriod: { start: '2026-11-14' },
      }).success,
    ).toBe(false);
    expect(
      serviceRequest.safeParse({
        ...requestFixture,
        code: undefined,
        orderDetail: [{ text: 'Example details' }],
      }).success,
    ).toBe(false);
  });

  it('requires exactly one supported Task output value and its type label', () => {
    const type = { text: 'Example output' };
    expect(taskParameter.safeParse({ type }).success).toBe(false);
    expect(taskParameter.safeParse({ valueReference: { reference: 'Encounter/x' } }).success).toBe(
      false,
    );
    expect(taskParameter.safeParse({ type, valueString: 'Example' }).success).toBe(true);
    expect(
      taskParameter.safeParse({
        type,
        valueString: 'Example',
        valueReference: { reference: 'Encounter/x' },
      }).success,
    ).toBe(false);
    expect(taskParameter.safeParse({ type, valueBoolean: true }).success).toBe(false);
    expect(
      taskParameter.safeParse({ type, valueString: 'Example', valueBoolean: true }).success,
    ).toBe(false);
  });

  it('rejects a task modification before creation, but does not invent a time for partial dates', () => {
    expect(
      task.safeParse({ ...taskFixture, lastModified: '2026-11-13T08:00:00-06:00' }).success,
    ).toBe(false);
    expect(
      task.safeParse({ ...taskFixture, authoredOn: '2026', lastModified: '2026-11' }).success,
    ).toBe(true);
  });
});
