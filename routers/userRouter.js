const requireUser = require("../middlewares/requireUser");
const userController = require("../controllers/userController");
const router = require("express").Router();

router.post(
	"/follow",
	requireUser,
	userController.followAndUnfollowUserController
);
router.get("/getFeedData", requireUser, userController.getFeedDataController);
router.get("/getMyPosts", requireUser, userController.getMyPostsController);
router.get("/getUserPosts", requireUser, userController.getUserPostsController);
router.delete("/", requireUser, userController.deleteMyProfileController);
router.get("/getMyInfo", requireUser, userController.getMyInfoController);
router.put("/", requireUser, userController.updateUserProfileController);
router.post(
	"/getUserProfile",
	requireUser,
	userController.getUserProfileController
);

module.exports = router;
