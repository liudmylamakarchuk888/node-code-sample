		const router = require('express').Router({mergeParams: true});
		const Admin = require("../../models/admin")

		const authenticate = require("../../lib/authenticators");

		router
			.route("/")
				.get(authenticate.admin, async (req, res) => {
					const admins = await Admin.getAll();
					res.render('./admins/index', {title: "Manage admin users", admins});
				})
				.post(authenticate.admin, async (req, res) => {
					try {
						const doc = await Admin.create(req.body);
						console.log(doc.data())
						res.redirect("/admin/" + doc.id)
					} catch (error){
						req.flash("error", error.message)
						res.redirect("/admin/new");
					}
				})

		router.get("/new", authenticate.admin, async (req, res) => {
			res.render('./admins/new', {title: "Create admin", admin: {}, USER_ROLES: Admin.ROLES});
		});

		router.get("/:admin_id/edit", authenticate.admin, async (req, res) => {
			const admin = await Admin.get(req.params.admin_id);
			res.render('./admins/edit', {title: "Edit admin", admin, USER_ROLES: Admin.ROLES});
		});


		router
			.route("/:admin_id")
				.get(authenticate.admin, async (req, res) => {
					const user = await Admin.get(req.params.admin_id);

					res.render('./users/show', {title: "Profile detail", user});
				})
				.put(authenticate.admin, async (req, res) => {
					try {
						const doc = await Admin.update(req.params.admin_id, req.body);
						res.redirect("/admin/" + doc.id)
					} catch (error){
						req.flash("error", error.message)
						res.redirect("/admin/" + req.params.admin_id + "/edit");
					}
				})
				.delete(authenticate.admin, async (req, res) => {
					try {
						const result = await Admin.destroy(req.params.admin_id);
						res.redirect("/admin/");
					} catch (error){
						req.flash("error", error.message)
						res.redirect("/admin");
					}
				});

		module.exports = router;