import { comparePasswords, hashPassword } from '../hashingPassword';

describe('Hashing Password Tests', () => {
    test('hashPassword - password and hash password must be different', async () => {
        const password = '12345';

        expect(await hashPassword(password)).not.toBe(password);
    });

    test('comparePasswords - password and hash password must be equal', async () => {
        const password = '12345';
        const hash = await hashPassword(password);
        expect(await comparePasswords(password, hash)).toBeTruthy();
    });
});