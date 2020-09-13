const router = require('express').Router({mergeParams: true});
const Company = require("../../models/company")

const utils = require("../../lib/utils");
const authenticate = require("../../lib/authenticators");

router
	.route("/")
		.get(authenticate.admin, async (req, res) => {
			const companies = await Company.getAll();
			res.render('./companies/index', {title: "Manage Companies", companies});
		})
		.post(authenticate.admin, utils.uploadFiles, async (req, res) => {
			try {
				let data = req.fields;

				if (req.files.image){
					const image = await utils.saveFileToFirebase(req.files.image);
					data.image = image;
				}

				const doc = await Company.create(data);
				res.redirect("/admin/companies/");
			} catch (error){
				req.flash("error", error.message)
				res.redirect("/admin/companies/new");
			}
		})

router.get("/new", authenticate.admin, async (req, res) => {
	res.render('./companies/new', {title: "Create Company", company: {}});
});

router.get("/:company_id/edit", authenticate.admin, async (req, res) => {
	const company = await Company.get(req.params.company_id);
	res.render('./companies/edit', {title: "Edit Company", company});
});

router
	.route("/:company_id")
		.get(authenticate.admin, async (req, res) => {
			const company = await Company.get(req.params.company_id);
			const campaigns = await Company.getCampaigns(req.params.company_id);

			res.render('./companies/show', {title: company.name + " campaigns", company, campaigns});
		})
		.put(authenticate.admin, utils.uploadFiles, async (req, res) => {

			try {
				let data = req.fields;

				if (req.files.image) data.image = await utils.saveFileToFirebase(req.files.image);

				const doc = await Company.update(req.params.company_id, data);
				res.redirect("/admin/companies/" + doc.id)
			} catch (error){
				console.log(error)
				req.flash("error", error.message)
				res.redirect("/admin/companies/" + req.params.company_id + "/edit");
			}
		})
		.delete(authenticate.admin, async (req, res) => {
			console.log("DELETTTTTTTTTTTTE")

			try {
				const result = await Company.destroy(req.params.company_id);
				console.log(result)
				res.redirect("/admin/companies/");
			} catch (error){
				console.log(error)
				req.flash("error", error.message)
				res.redirect("/admin/companies");
			}
		});

module.exports = router;