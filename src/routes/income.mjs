import { Router } from "express";
import { isLoggedIn } from "../middleware/isLoggedIn.mjs";
import { createIncomeValidationSchema } from "../utils/validationSchema.mjs";
import {
    query,
    validationResult,
    checkSchema,
    matchedData,
} from "express-validator";
import Income from "../models/income.mjs";
const router = Router()
router.post('/create-income', checkSchema(createIncomeValidationSchema), isLoggedIn, async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) return res.status(400).send(result.array());
    const data = matchedData(req);
    const incomeData = {
        ...data,
        user: req.user._id
    };

    const newIncome = new Income(incomeData);
    try {
        const savedIncome = await newIncome.save();
        const userIncomeResponse = savedIncome.toObject();
        return res.status(201).send(userIncomeResponse);
    } catch (error) {
        return res.status(400).send({ error: error.message });
    }

})

router.get('/all-incomes', isLoggedIn, async (req, res) => {

    try {
        const incomes = await Income.find({ user: req.user._id });

        res.send(incomes).status(200);
    } catch (error) {
        return res.status(401).send("are you even logged in?")
    }
})
export default router 