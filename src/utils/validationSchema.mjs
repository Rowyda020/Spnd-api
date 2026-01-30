export const createUserValidationSchema = {
    username: {
        isLength: {
            options: {
                min: 5,
                max: 52
            },
            errorMessage: "Username must be at least 5 characters with a max of 52 characters"
        },
        notEmpty: {
            errorMessage: "Username cannot be empty",
        },
        isString: {
            errorMessage: "Username must be a string!",
        }
    },
    password: {
        notEmpty: {
            errorMessage: "Password cannot be empty"
        },
    },
    email: {
        isString: {
            errorMessage: "email must be a string!",
        },
        notEmpty: {
            errorMessage: "Email cannot be empty"
        },
        isEmail: {  // ✅ Add this
            errorMessage: "Must be a valid email address"
        },
        normalizeEmail: true  // ✅ Sanitizes email
    }
}

export const createIncomeValidationSchema = {
    amount: {
        notEmpty: {
            errorMessage: "Please provide the amount of your income"
        },
        isNumeric: {
            errorMessage: "Amount must be a valid number"
        },
        custom: {
            options: (value) => Number(value) > 0,
            errorMessage: "Amount must be greater than 0"
        }
    },
    source: {   // ← fixed typo: soruce → source
        notEmpty: {
            errorMessage: "Please provide the source of income"
        },
        isString: {
            errorMessage: "Source must be a string"
        },
        trim: true
    },
    category: {
        isString: {
            errorMessage: "Category must be a string"
        },
        notEmpty: {
            errorMessage: "Please provide the category of your income"
        },
        trim: true
    },
    date: {   // optional, but good to validate if sent
        optional: true,
        isISO8601: {
            errorMessage: "Invalid date format (use YYYY-MM-DD)"
        }
    }
};
export const createExpenseValidationSchema = {
    amount: {
        notEmpty: {
            errorMessage: "Please provide the amount of your income"
        }
    },
    description: {
        isString: {
            errorMessage: "Please provide the source of income"
        }
    },
    category: {
        isString: {
            errorMessage: "category must be a string"
        },
        notEmpty: {
            errorMessage: "Please provide the category of your income"
        }
    },
}


export const createsharedBudgetValidationSchema = {
    amount: {
        notEmpty: {
            errorMessage: "Please provide the amount of your income"
        }
    },

    participants: {
        isArray: true,
        custom: {
            options: (value) => value.length > 0,
            errorMessage: "Participants array cannot be empty"
        },
        notEmpty: {
            errorMessage: "Please provide the category of your income"
        }
    },
    budgetname: {
        isString: true,
        notEmpty: {
            errorMessage: "Please provide the budgetname"
        }
    }
}