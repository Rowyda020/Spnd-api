import { Router } from 'express'
import authRouter from './auth.mjs'
import incomeRouter from './income.mjs'
import expenseRouter from './expense.mjs'
import sharedBudgetRouter from './sharedBudget.mjs'
const router = Router()
router.use(authRouter)
router.use(incomeRouter)
router.use(expenseRouter)
router.use(sharedBudgetRouter)
export default router