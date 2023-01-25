const { json } = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const { error, success } = require("../utils/responseWrapper");
const { mapPostOutput } = require("../utils/Utils");
const cloudinary = require("cloudinary").v2;

const followAndUnfollowUserController = async (request, response) => {
	try {
		const { userIdToFollow } = request.body;
		const curUserId = request._id;

		const userToFollow = await User.findById(userIdToFollow);
		const curUser = await User.findById(curUserId);

		if (curUserId === userIdToFollow) {
			return response.send(error(409, "Users cannot follow themselves"));
		}

		if (!userToFollow) {
			return response.send(error(404, "User to follow not found"));
		}

		if (curUser.followings.includes(userIdToFollow)) {
			//already followed
			const followingIndex = curUser.followings.indexOf(userIdToFollow);
			curUser.followings.splice(followingIndex, 1);

			const followerIndex = userToFollow.followers.indexOf(curUser);
			userToFollow.followers.splice(followerIndex, 1);
		} else {
			//not followed

			userToFollow.followers.push(curUserId);
			curUser.followings.push(userIdToFollow);
		}

		await userToFollow.save();
		await curUser.save();

		return response.send(success(200, { user: userToFollow }));
	} catch (e) {
		console.log("this error occurs on follow and  unfollow");
		return response.send(error(500, e.message));
	}
};

const getFeedDataController = async (request, response) => {
	//In this way we check all the posts and find which has the current user's followings. We fetch all of them
	try {
		const curUserId = request._id;
		const curUser = await User.findById(curUserId).populate("followings");

		const fullPosts = await Post.find({
			owner: {
				$in: curUser.followings,
			},
		}).populate("owner");

		const posts = fullPosts
			.map((item) => mapPostOutput(item, request._id))
			.reverse();

		curUser.posts = posts;
		const followingsIds = curUser.followings.map((item) => item._id);
		followingsIds.push(request._id);

		const suggestions = await User.find({
			_id: {
				$nin: followingsIds,
			},
		});

		return response.send(
			success(200, { ...curUser._doc, suggestions, posts })
		);
	} catch (e) {
		return response.send(error(500, e.message));
	}
};

const getMyPostsController = async (request, response) => {
	try {
		const curUserId = request._id;

		const allUserPosts = await User.find({
			owner: curUserId,
		}).populate("likes");
		response.send(success(200, { allUserPosts }));
	} catch (e) {
		return response.send(error(500, e.message));
	}
};
const getUserPostsController = async (request, response) => {
	try {
		const userId = request.body.userId;

		if (!userId) {
			return response.send(error(400, "userId is required"));
		}

		const allUserPosts = await User.find({
			owner: userId,
		}).populate("likes");
		response.send(success(200, { allUserPosts }));
	} catch (e) {
		return response.send(error(500, e.message));
	}
};

const deleteMyProfileController = async (request, response) => {
	try {
		const curUserId = request._id;
		const curUser = await User.findById(curUserId);

		//delete all posts
		await Post.deleteMany({
			owner: curUserId,
		});

		//ye user jitne bhi logo ko follow karta hai unsab ke following vali entry me se delete karna hai
		curUser.followers.forEach(async (followerId) => {
			const follower = await User.findById(followerId);
			const index = follower.followings.indexOf(curUserId);
			follower.followings.splice(index, 1);
			await follower.save();
		});

		//ab ye user jitne bhi logo ko follow karta hai unsab ki followers ki list me se bhi nikal jayega
		curUser.followings.forEach(async (followingId) => {
			const following = await User.findById(followingId);
			const index = following.followers.indexOf(curUserId);
			following.followers.splice(index, 1);
			await following.save();
		});

		//ab jidhar bhi like kiya tha waha se likes bhi gayab ho jayenge
		const allPosts = await Post.find();
		allPosts.forEach(async (post) => {
			const index = post.likes.indexOf(curUserId);
			post.likes.splice(index, 1);
			await post.save();
		});

		//ab user finally delete kar sakte hai
		await curUser.remove();

		//cookie bhi delete karenge iski
		response.clearCookie("jwt", {
			httpOnly: true,
			secure: true,
		});

		return response.send(success(200, "User deleted successfully"));
	} catch (e) {
		return response.send(error(500, e.message));
	}
};

const getMyInfoController = async (request, response) => {
	try {
		const user = await User.findById(request._id);

		return response.send(success(200, { user }));
	} catch (e) {
		return response.send(error(500, e.message));
	}
};

const updateUserProfileController = async (request, response) => {
	try {
		const { name, bio, userImage } = request.body;
		const user = await User.findById(request._id);
		if (name) {
			user.name = name;
		}

		if (bio) {
			user.bio = bio;
		}

		if (userImage) {
			const cloudImage = await cloudinary.uploader.upload(userImage, {
				folder: "profileImage",
			});
			user.avatar = {
				url: cloudImage.secure_url,
				publicId: cloudImage.public_id,
			};
		}
		await user.save();
		return response.send(success(200, { user }));
	} catch (e) {
		console.log(e);
		return response.send(error(500, e.message));
	}
};

const getUserProfileController = async (request, response) => {
	try {
		const userId = request.body.userId;
		const user = await User.findById(userId).populate({
			path: "posts",
			populate: {
				path: "owner",
			},
		});

		const fullPosts = user.posts;
		const posts = fullPosts
			.map((item) => mapPostOutput(item, request._id))
			.reverse();

		return response.send(success(200, { ...user._doc, posts }));
	} catch (e) {
		return response.send(error(500, e.message));
	}
};

module.exports = {
	followAndUnfollowUserController,
	getFeedDataController,
	getMyPostsController,
	getUserPostsController,
	deleteMyProfileController,
	getMyInfoController,
	updateUserProfileController,
	getUserProfileController,
};
