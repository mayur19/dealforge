import { DomainError } from '../errors.js';
import { isIsoDate } from '../dates.js';
import { BPS_SCALE, MAX_QUANTITY } from '../money.js';
import { RULE_CATEGORIES, type PricingRule, type RuleConditions } from './types.js';

/**
 * Server-side validation of declarative pricing rules (FR-05). Rules are data,
 * never code: anything outside this schema is rejected before pricing.
 */
export interface RuleIssue {
  readonly path: string;
  readonly message: string;
}

export const MAX_RULE_PRIORITY = 10_000;

const isIntIn = (value: number, min: number, max: number): boolean =>
  Number.isSafeInteger(value) && value >= min && value <= max;

function actionIssues(rule: PricingRule): RuleIssue[] {
  const { action } = rule;
  if (action.type === 'PERCENT_DISCOUNT') {
    return isIntIn(action.bps, 1, BPS_SCALE)
      ? []
      : [{ path: 'action', message: 'Percent discount must be 1-10000 bps' }];
  }
  if (action.type === 'FIXED_DISCOUNT') {
    return isIntIn(action.amountMinorPerUnit, 1, Number.MAX_SAFE_INTEGER)
      ? []
      : [{ path: 'action', message: 'Fixed discount must be a positive integer amount' }];
  }
  return [{ path: 'action', message: 'Unsupported action type' }];
}

function dateIssues(rule: PricingRule): RuleIssue[] {
  const issues: RuleIssue[] = [];
  if (!isIsoDate(rule.effectiveFrom)) {
    issues.push({ path: 'effectiveFrom', message: 'Must be a YYYY-MM-DD date' });
  }
  if (rule.effectiveUntil !== null) {
    if (!isIsoDate(rule.effectiveUntil)) {
      issues.push({ path: 'effectiveUntil', message: 'Must be a YYYY-MM-DD date or null' });
    } else if (rule.effectiveUntil < rule.effectiveFrom) {
      issues.push({ path: 'effectiveUntil', message: 'Must not be before effectiveFrom' });
    }
  }
  return issues;
}

const LIST_KEYS = ['productIds', 'productCategories', 'customerTiers', 'bundleCodes'] as const;

function conditionIssues(conditions: RuleConditions): RuleIssue[] {
  const issues: RuleIssue[] = [];
  for (const key of LIST_KEYS) {
    const list = conditions[key];
    if (list !== undefined && list.length === 0) {
      issues.push({ path: `conditions.${key}`, message: 'Omit the condition instead of []' });
    }
  }
  const { minQuantity, maxQuantity } = conditions;
  if (minQuantity !== undefined && !isIntIn(minQuantity, 1, MAX_QUANTITY)) {
    issues.push({ path: 'conditions.minQuantity', message: 'Must be a positive integer' });
  }
  if (maxQuantity !== undefined && !isIntIn(maxQuantity, 1, MAX_QUANTITY)) {
    issues.push({ path: 'conditions.maxQuantity', message: 'Must be a positive integer' });
  } else if (minQuantity !== undefined && maxQuantity !== undefined && maxQuantity < minQuantity) {
    issues.push({ path: 'conditions.maxQuantity', message: 'Must be >= minQuantity' });
  }
  return issues;
}

export function ruleIssues(rule: PricingRule): readonly RuleIssue[] {
  const issues: RuleIssue[] = [];
  if (rule.id.trim().length === 0) issues.push({ path: 'id', message: 'Required' });
  if (!(RULE_CATEGORIES as readonly string[]).includes(rule.category)) {
    issues.push({ path: 'category', message: 'Unknown rule category' });
  }
  if (!isIntIn(rule.priority, 0, MAX_RULE_PRIORITY)) {
    issues.push({ path: 'priority', message: `Must be an integer 0-${MAX_RULE_PRIORITY}` });
  }
  if (!isIntIn(rule.maxDiscountBps, 0, BPS_SCALE)) {
    issues.push({ path: 'maxDiscountBps', message: 'Must be 0-10000 bps' });
  }
  return [
    ...issues,
    ...dateIssues(rule),
    ...actionIssues(rule),
    ...conditionIssues(rule.conditions),
  ];
}

export function assertValidRule(rule: PricingRule): PricingRule {
  const issues = ruleIssues(rule);
  if (issues.length > 0) {
    throw new DomainError('INVALID_RULE', `Pricing rule ${rule.id} is invalid`, {
      ruleId: rule.id,
      issues,
    });
  }
  return rule;
}
