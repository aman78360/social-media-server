const router = require("express").Router();
const postController = require("../controllers/postController");
const requireUser = require("../middlewares/requireUser");

router.post("/", requireUser, postController.createPostController);
router.post("/like", requireUser, postController.likeAndUnlikePostController);
router.put("/", requireUser, postController.updatePostController);
router.delete("/", requireUser, postController.deletePostController);
module.exports = router;
