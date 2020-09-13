const router = require('express').Router({mergeParams: true});
const Notification = require("../../models/notification");
const Demographic = require("../../models/demographic");
const User = require("../../models/user");

const authenticate = require("../../lib/authenticators");

router.get("/new", authenticate.admin, async (req, res) => {
	const [demographics, allUsers] = await Promise.all([ Demographic.getAll(), User.getAll({user_role: 2, is_deleted: 0}) ]);

	const users = allUsers.sort((a, b) => a.first_name.localeCompare(b.first_name));

	res.render("./notifications/new", {title: "Send New Notification", demographics, users});
});

router.post("/", authenticate.admin, async (req, res) => {
	let data = req.body;

	try {
		const doc = await Notification.create(data);
		res.json("/admin/users/");
	} catch (error){
		console.log(error)
		req.flash("error", error.message);
		res.json("/admin/notifications/new");
	}
});


module.exports = router;