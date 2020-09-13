const router = require('express').Router({mergeParams: true});
const Campaign = require("../../models/campaign");
const CampaignModule = require("../../models/campaign_module");
const Answer = require("../../models/answer");
const ConfirmationCode = require("../../models/confirmation_code");

const json2xls = require('json2xls');
const authenticate = require("../../lib/authenticators");

router.get("/", authenticate.admin, async (req, res) => {
	try {
		const data = await Campaign.getAll({completed: 1});
		res.render('./campaigns/index', {title: "Manage Campaigns", data});
	} catch (error){
		req.flash("error", error.message)
		res.redirect("/admin/dashboard");
	}
});


router.get("/new", authenticate.admin, async (req, res) => {
	try {
		const campaign = await Campaign.create(req.query.default === "1" ? {users_specific: 0, is_default: 1} : {});
		res.redirect("/admin/campaigns/" + campaign.id + "/create/1");
	} catch (error){
		req.flash("error", error.message);
		res.redirect("/admin/campaigns")
	}
});


router.get("/codes", authenticate.admin, async (req, res) => {
	try {
		const data = await Campaign.getAll({confirmation_code: 1});
		res.render('./campaigns/codes', {title: "Campaigns' Codes", data});
	} catch (error){
		req.flash("error", error.message)
		res.redirect("/admin/campaigns");
	}
});

router.get("/:campaign_id/codes", authenticate.admin, async (req, res) => {
	try {
		const campaign = await Campaign.get(req.params.campaign_id);
		const data = await ConfirmationCode.getAll({campaign_id: campaign.id});
		res.render('./campaigns/campaign_codes', {title: campaign.title + " - Campaign's Codes", data});
	} catch (error){
		req.flash("error", error.message)
		res.redirect("/admin/campaigns");
	}
});


router.get("/:campaign_id/edit", authenticate.admin, async (req, res) => {
	try {
		res.redirect("/admin/campaigns/" + req.params.campaign_id + "/create/1");
	} catch (error){
		req.flash("error", error.message)
		res.redirect("/admin/campaigns");
	}
});

router.get("/:campaign_id/export1", authenticate.admin, async (req, res) => {
	const data = await Campaign.export1(req.params.campaign_id);
	res.setHeader('Content-Type', 'application/vnd.openxmlformats');
	res.setHeader("Content-Disposition", "attachment; filename=" + "campaigns-1-" + Date.now() + ".xlsx");
	res.end(json2xls(data), 'binary');
});

router.get("/:campaign_id/export2", authenticate.admin, async (req, res) => {
	const data = await Campaign.export2(req.params.campaign_id);

	res.setHeader('Content-Type', 'application/vnd.openxmlformats');
	res.setHeader("Content-Disposition", "attachment; filename=" + "campaigns-2-" + Date.now() + ".xlsx");
	res.end(json2xls(data), 'binary');
});

router.get("/:campaign_id/export/generate", authenticate.admin, async (req, res) => {
	Answer.precompile(req.params.campaign_id);
	req.flash("success", "Generating reports");
	res.redirect("/admin/campaigns")
});

router
	.route("/:campaign_id")
		.get(authenticate.admin, async (req, res) => {
			try {
				const campaign = await Campaign.get(req.params.campaign_id);
				const modules = await CampaignModule.getAll({campaign_id: campaign.id})
				res.render('./campaigns/show', {title: "Campaign Modules", campaign, modules, MODULE_NAMES: CampaignModule.MODULE_NAMES});
			} catch (error){
				req.flash("error", error.message)
				res.redirect("/admin/campaigns");
			}
		})
		.put(authenticate.admin, async (req, res) => {
			try {
				delete req.query._method
				const doc = await Campaign.update(req.params.campaign_id, req.query);
				res.redirect("/admin/campaigns/")
			} catch (error){
				req.flash("error", error.message)
				res.redirect("/admin/campaigns/" + req.params.campaign_id + "/edit");
			}
		})
		.delete(authenticate.admin, async (req, res) => {

			try {
				const result = await Campaign.destroy(req.params.campaign_id);
				res.redirect("/admin/campaigns/");
			} catch (error){
				console.log(error)
				req.flash("error", error.message)
				res.redirect("/admin/campaigns");
			}
		});

module.exports = router;