import bcrypt from 'bcrypt'

const saltRounds = 10;
export const hashPass = (password) => {
    const salt = bcrypt.genSaltSync(saltRounds);
    console.log("Salt generated:", salt);
    return bcrypt.hashSync(password, salt);
}

export const comparePass = (plain, hashed) => {
    return bcrypt.compareSync(plain, hashed);
}
export default hashPass