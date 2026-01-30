import { Router } from "express";
import { isLoggedIn } from "../middleware/isLoggedIn.mjs";
import SharedBudget from "../models/sharedBudget.mjs";
import Income from "../models/income.mjs";
import { createsharedBudgetValidationSchema } from "../utils/validationSchema.mjs";
import { checkSchema, matchedData, validationResult } from "express-validator";
import { sendSharedBudgetEmail } from "../utils/emailHelper.mjs";
import Expense from "../models/expense.mjs";
import { authenticateJWT } from "../middleware/jwtAuth.mjs";
import User from "../models/user.mjs";
const router = Router();



router.post(
    '/create-sharedBudget',
    authenticateJWT,
    checkSchema(createsharedBudgetValidationSchema),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json(errors.array());

        const data = matchedData(req);

        try {
            let participantUsers = await User.find({
                email: { $in: data.participants }
            });

            if (participantUsers.length !== data.participants.length) {
                const existingEmails = participantUsers.map(u => u.email);
                const invalidEmails = data.participants.filter(e => !existingEmails.includes(e));
                return res.status(400).json({
                    error: `These emails are not registered: ${invalidEmails.join(', ')}`
                });
            }

            const participantIds = participantUsers.map(u => u._id);

            const budgetData = {
                budgetname: data.budgetname,
                user: req.user._id,
                participants: participantIds,
                amount: data.amount || 0
            };

            const savedBudget = await SharedBudget.create(budgetData);

            await Promise.all(
                participantUsers.map(u =>
                    sendSharedBudgetEmail(u.email, budgetData.budgetname, req.user.username).catch(err =>
                        console.error(`Failed to send email to ${u.email}:`, err)
                    )
                )
            );

            return res.status(201).json(savedBudget);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }
    }
);


router.post('/adding-budget', authenticateJWT, async (req, res) => {
    const { amount } = req.body;
    const addedAmount = parseFloat(amount);
    const expenseDaat = {
        user: req.user._id,
        amount: amount,
        description: "roomies",
        category: "shared budget"
    };


    if (isNaN(addedAmount) || addedAmount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
    }

    try {
        // Step 1: Find the shared budget where user is a participant
        const sharedBudget = await SharedBudget.findOne({ participants: req.user._id });

        if (!sharedBudget) {
            return res.status(400).json({ error: "You are not a participant in any shared budget" });
        }
        if (addedAmount < req.user.totalIncome) {
            const updatedIncome = Number((req.user.totalIncome - addedAmount).toFixed(3))
            const updateUserTotalIncome = await User.findById(req.user._id)
            const newExpense = new Expense(expenseDaat);

            await SharedBudget.updateOne(
                { _id: sharedBudget._id },
                { $inc: { amount: addedAmount } }
            );
            await updateUserTotalIncome.updateOne({ totalIncome: updatedIncome })
            const updatedBudget = await SharedBudget.findById(sharedBudget._id);
            await newExpense.save();
            return res.status(200).json(updatedBudget);
        }
        return res.status(400).send("are you stupid?")




    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});
router.get('/shared-budgets', authenticateJWT, async (req, res) => {
    try {
        const budgets = await SharedBudget.find({
            $or: [
                { user: req.user._id },
                { participants: req.user._id }
            ]
        }).populate('user', 'username email');
        res.json(budgets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// router.post('/using-budget', checkSchema(createIncomeValidationSchema), isLoggedIn, async (req, res) => {
//     const result = validationResult(req)
//     if (!result.isEmpty()) return res.status(400).send(result.array());
//     const data = matchedData(req);
//     console.log(req.user)
//     const incomeData = {
//         ...data,
//         user: req.user._id
//     };

//     const updatedIncome = Number((data.amount + req.user.totalIncome).toFixed(3))
//     const newIncome = new Income(incomeData);
//     const updateUserTotalIncome = await User.findById(req.user._id)
//     try {
//         const savedIncome = await newIncome.save();
//         await updateUserTotalIncome.updateOne({ totalIncome: updatedIncome })
//         const userIncomeResponse = savedIncome.toObject();
//         return res.status(201).send(userIncomeResponse);
//     } catch (error) {
//         return res.status(400).send({ error: error.message });
//     }

// })

export default router