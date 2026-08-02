/**
 * validateRequest(schema, source): returns middleware that validates the given
 * request part ('body' | 'params' | 'query') against a Zod schema. On success
 * the parsed/coerced value replaces the raw one. On failure returns 400 with
 * flattened field errors.
 */
export function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req[source] = result.data;
    return next();
  };
}
