import { createValidationService } from '../../../src/service/validation/service';
import { validationRules } from '../../../src/service/validation/rules';

// The same pure schema and profile checks as the local API. No adapter or network.
export const teachingValidator = createValidationService(validationRules);
