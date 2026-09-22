import { ZodError } from "zod";
import { sendError } from "@/utils/response";
export function validate(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                return sendError(res, "Validation failed", 422, err.flatten().fieldErrors);
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validation.middleware.js.map