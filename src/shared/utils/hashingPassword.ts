import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(enteredPassword: string, storedPassword: string) {
    return await bcrypt.compare(enteredPassword, storedPassword);
}