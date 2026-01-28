import { Router } from 'express'
import authRouter from './auth.mjs'
import incomeRouter from './income.mjs'
const router = Router()
router.use(authRouter)
router.use(incomeRouter)
export default router