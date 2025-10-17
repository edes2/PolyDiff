export namespace UserInfoValidation {
    export const isEmailValid = (email: string): boolean => {
        const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        return emailRegex.test(email);
    };

    export const isUsernameValid = (username: string): boolean => {
        const usernamePattern = /^[a-zA-Z0-9]{2,30}$/;
        return usernamePattern.test(username);
    };

    export const isPasswordValid = (password: string): boolean => {
        const hasLetter = /[a-zA-Z]/;
        const hasNumber = /\d/;
        // const hasSpecialChar = /[@$!%*?&]/;
        const isProperLength = /^.{6,30}$/;
        return (hasLetter.test(password) || hasNumber.test(password)) && isProperLength.test(password);
    };
}
