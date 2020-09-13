const router = require('express').Router({mergeParams: true});
const User = require("../../models/user");
const Note = require("../../models/note");
const Model = require("../../models/model");
const Demographic = require("../../models/demographic");

const authenticate = require("../../lib/authenticators");

router.get("/", authenticate.admin, async (req, res) => {
	const users = await User.getAll({user_role: 2, is_deleted: 0});
	res.render('./users/index', {title: "Manage Users", users});
});

router.post("/filter", async(req, res) => {
	let data = req.body;
	const filters = await Demographic.prepareFilters(data.demographics || {});
	return res.json(filters)
})

router.get("/export", authenticate.admin, async (req, res) => {
	const users = await User.getAll({user_role: 2, is_deleted: 0});
	res.setHeader('Content-Type', 'application/vnd.openxmlformats');
	res.setHeader("Content-Disposition", "attachment; filename=" + "users-" + Date.now() + ".xlsx");

	res.end(User.generateXLS(users), 'binary');
});

router.get("/:user_id/edit", authenticate.admin, async (req, res) => {
	const user = await User.get(req.params.user_id);
	const demographics = await Demographic.getAll();
	res.render('./users/edit', {title: "Edit user", user, demographics, STATES: User.STATES});
});

router.put("/payment_tier", async (req, res) => {
	for (let id of req.body.id){ await User.update(id, {payment_tire: req.body.payment_tire}); }
	res.sendStatus(200);
})

router.put("/archive", authenticate.admin, async (req, res) => {
	for (let id of req.body.id){ await User.update(id, {archived: '1'}); }
	res.sendStatus(200);
});

router.get("/:user_id/unarchive", authenticate.admin, async (req, res) => {
	const userId = req.params.user_id;
	await User.update(userId, {archived: '0'})
	res.redirect("/admin/users")
});

router.put("/unzip", authenticate.admin, async (req, res) => {
	for (let id of req.body.id){ await User.update(id, {archived: '0'}); }
	res.sendStatus(200);
});

router.delete("/delete", authenticate.admin, async (req, res) => {
	for (let id of req.body.id){ await User.destroy(id); }
	res.sendStatus(200);
});

router
	.route("/:user_id")
		.get(authenticate.admin, async (req, res) => {
			const user = await User.get(req.params.user_id);
			console.log(user)
			const notes = await Note.getAll({user_id: user.id})

			res.render('./users/show', {title: "Profile Detail", user, notes});
		})
		.put(authenticate.admin, async (req, res) => {
			console.log(req.body)

			if (req.body.entertainment){
				req.body.entertainment = Array.isArray(req.body.entertainment) ? req.body.entertainment.join("_") : req.body.entertainment
			} else {
				req.body.entertainment = ""
			}

			if (req.body.lifestyle){
				req.body.lifestyle = Array.isArray(req.body.lifestyle) ? req.body.lifestyle.join("_") : req.body.lifestyle
			} else {
				req.body.lifestyle = ""
			}

			console.log(req.body)

			try {
				const doc = await User.update(req.params.user_id, req.body);
				res.redirect("/admin/users/" + doc.id)
			} catch (error){
				req.flash("error", error.message)
				res.redirect("/admin/users/" + req.params.user_id + "/edit");
			}
		})
		.delete(authenticate.admin, async (req, res) => {
			try {
				const result = await User.destroy(req.params.user_id);
				res.redirect("/admin/users/");
			} catch (error){
				req.flash("error", error.message)
				res.redirect("/admin/users");
			}
		})







module.exports = router;