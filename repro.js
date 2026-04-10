import { authSchema } from './src/lib/validation.js';

const result = authSchema.safeParse({ email: 'test@example.com', password: '123' });
console.log('Result Success:', result.success);
if (!result.success) {
    console.log('Error Object Keys:', Object.keys(result.error));
    console.log('Issues:', result.error.issues);
}
