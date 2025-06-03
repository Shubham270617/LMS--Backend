import express from "express"
import {getAllUSers, registerNewAdmin} from "../controllers/userControllers.js"
import {isAuthenticated, isAuthorized} from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get('/all', isAuthenticated, isAuthorized("Admin"), getAllUSers)
router.post('/add/new-admin', isAuthenticated, isAuthorized("Admin"), registerNewAdmin)

export default router