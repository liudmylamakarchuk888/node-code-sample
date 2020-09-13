const router = require('express').Router({mergeParams: true});
const Campaign = require("../../models/campaign");
const Demographic = require("../../models/demographic");
const Company = require("../../models/company");
const Module = require("../../models/module");
const CampaignModule = require("../../models/campaign_module");
const Notification = require("../../models/notification");
const User = require("../../models/user");

const qs = require('qs');
const utils = require("../../lib/utils");
const authenticate = require("../../lib/authenticators");


router
	.route("/1")
		.get(authenticate.admin, async (req, res) => {
			const campaignID = req.params.campaign_id;
			try {
				const [allCompanies,campaign,allModules,modules] = await Promise.all([Company.getAll(), Campaign.get(campaignID), Module.getAll(), CampaignModule.getAll({campaign_id: campaignID}) ]);
				const companies = allCompanies.sort((a, b) => a.name.localeCompare(b.name));
				console.log(allModules)

				res.render('./create_campaign/step_1', {
					title: "Create Campaign - Selecting Modules", 
					MODULE_NAMES: CampaignModule.MODULE_NAMES,
					campaign, 
					companies, 
					modules, 
					allModules
				});
			} catch (error){
				console.log(error)
				req.flash("error", error.message);
				res.redirect("/admin/campaigns")
			}
		})
		.post(authenticate.admin, async (req, res) => {
			const campaignID = req.params.campaign_id;

			if (!req.body.modules || req.body.modules.split(",").filter(Boolean).length === 0) {
				req.flash("error", "You should select at least one module");
				res.redirect("/admin/campaigns/" + campaignID + "/create/1")
			}

			const company = await Company.get(req.body.company_id);

			try {
				let data = {
					title: req.body.title,
					company_id: req.body.company_id,
					company_name: company.name,
					is_removeable: req.body.is_removeable,
					paid: req.body.paid === "on" ? 1 : 0,
					confirmation_code: req.body.confirmation_code === "on" ? 1 : 0
				}

				const campaign = await Campaign.update(campaignID, data);

				const modules = await CampaignModule.create(campaign, req.body.modules.split(",").filter(Boolean));

				res.redirect("/admin/campaigns/" + campaign.id + "/create/2");
			} catch (error){
				req.flash("error", error.message);
				res.redirect("/admin/campaigns/" + campaignID + "/create/1")
			}
		});

router
	.route("/2")
		.get(authenticate.admin, async (req, res) => {
			const campaignID = req.params.campaign_id;
			const campaign = await Campaign.get(campaignID);
			const modules = await CampaignModule.getAll({ campaign_id: campaign.id })

			let body = qs.parse(req.fields);
			let files = qs.parse(req.files);
			console.log(modules)
			try {
				res.render('./create_campaign/step_2', {
					title: "Create Campaign - Content", 
					MODULE_NAMES: CampaignModule.MODULE_NAMES,
					campaignID, 
					campaign, 
					modules
				});
			} catch (error){
				req.flash("error", error.message);
				res.redirect("/admin/campaigns/" + campaignID + "/create/1")
			}
		})
		.post(authenticate.admin, utils.uploadFiles, async (req, res) => {
			const campaignID = req.params.campaign_id;

			let body = qs.parse(req.fields);
			let files = qs.parse(req.files);

			if (files && files.modules){
				for (let moduleId of Object.keys(files.modules)){
					for (let field of Object.keys(files.modules[moduleId])){
						body.modules[moduleId][field] = await utils.saveFileToFirebase(files.modules[moduleId][field]);
					}
				}
			}



			if (body && body.modules){
				for (let moduleId of Object.keys(body.modules)){

					body.modules[moduleId]['social'] = body.modules[moduleId]['social'] == 'facebook' ? "facebook" : "twitter"
					body.modules[moduleId]['is_hidden'] = body.modules[moduleId]['is_hidden'] == 'on' ? 1 : 0
					body.modules[moduleId]['is_watermark'] = body.modules[moduleId]['is_watermark'] == 'on' ? 1 : 0
					body.modules[moduleId]['multi_select'] = body.modules[moduleId]['multi_select'] == 'on' ? 1 : 0
					console.log(body.modules)
				}
			}


			try {
				const result = await CampaignModule.batchUpdate(body.modules);
				res.redirect("/admin/campaigns/" + campaignID + "/create/8");
			} catch (error){
				console.log(error)
				req.flash("error", error.message);
				res.redirect("/admin/campaigns/" + campaignID + "/create/2")
			}
		});

router
	.route("/3")
		.get(authenticate.admin, async (req, res) => {
			const campaignID = req.params.campaign_id;

			const campaign = await Campaign.get(campaignID);
			const [demographics, allUsers] = await Promise.all([ Demographic.getAll(), User.getAll({user_role: 2, is_deleted: 0}) ]);

			const users = allUsers.sort((a, b) => a.first_name.localeCompare(b.first_name));

			try {
				res.render('./create_campaign/step_3', {title: "Create Campaign - Select Audience", campaign, demographics, users, campaignID});
			} catch (error){
				req.flash("error", error.message);
				res.redirect("/admin/campaigns/" + campaignID + "/create/2")
			}
		})
		.post(async (req, res) => {

			const campaignID = req.params.campaign_id;

			try {
				console.log(req.body)
				if (req.body.users){
					var users = req.body.users || [];
					if (!Array.isArray(users)) users = [users];
					console.log(users.length)

					const campaign = await Campaign.update(campaignID, { users, demographics: req.body.demographics });
					console.log(campaign)
				}
				res.json("/admin/campaigns/" + campaignID + "/create/4");
			} catch (error){
				console.log(error);
				req.flash("error", error.message);
				res.redirect("/admin/campaigns/" + campaignID + "/create/3");
			}
		});

router
	.route("/4")
		.get(authenticate.admin, async (req, res) => {
			const campaignID = req.params.campaign_id;
			const campaign = await Campaign.get(campaignID);


			try {
				res.render('./create_campaign/step_4', {title: "Create Campaign - Social Sharing", campaignID, campaign});
			} catch (error){
				req.flash("error", error.message);
				res.redirect("/admin/campaigns/" + campaignID + "/create/3")
			}
		})
		.post(authenticate.admin, async (req, res) => {
			try {

				console.log(req.body)

				const data = { ...req.body, allow_sharing: req.body.allow_sharing, completed: 1, status: 1, approval: 1};

				console.log(data)

				const campaign = await Campaign.update(req.params.campaign_id, data);

				if (req.body.notification_text){
					Notification.create({ notification: req.body.notification_text, users: campaign.users });
				}


				res.redirect("/admin/campaigns")
			} catch (error){
				req.flash("error", error.message);
				res.redirect("/admin/campaigns/" + campaignID + "/create/4")
			}
		});

	router
		.route("/8")
			.get(authenticate.admin, async (req, res) => {
				const campaignID = req.params.campaign_id;
				const campaign = await Campaign.get(campaignID);
				const modules = await CampaignModule.getAll({ campaign_id: campaign.id })
	
				let body = qs.parse(req.fields);
				let files = qs.parse(req.files);
				//console.log(modules)
				try {										
					res.render('./create_campaign/step_8', {
						title: "Create Campaign - Content", 
						MODULE_NAMES: CampaignModule.MODULE_NAMES,
						campaignID, 
						campaign, 
						modules,
						step:8
					});
				} catch (error){
					req.flash("error", error.message);
					res.redirect("/admin/campaigns/" + campaignID + "/create/8")
				}
			})
			.post(authenticate.admin, utils.uploadFiles, async (req, res) => {
				const campaignID = req.params.campaign_id;
	
				let body = qs.parse(req.fields);
				let files = qs.parse(req.files);
	
				if (files && files.modules){
					for (let moduleId of Object.keys(files.modules)){
						for (let field of Object.keys(files.modules[moduleId])){
							body.modules[moduleId][field] = await utils.saveFileToFirebase(files.modules[moduleId][field]);
						}
					}
				}
	
	
	
				if (body && body.modules){
					for (let moduleId of Object.keys(body.modules)){
	
						body.modules[moduleId]['social'] = body.modules[moduleId]['social'] == 'facebook' ? "facebook" : "twitter"
						body.modules[moduleId]['is_hidden'] = body.modules[moduleId]['is_hidden'] == 'on' ? 1 : 0
						body.modules[moduleId]['is_watermark'] = body.modules[moduleId]['is_watermark'] == 'on' ? 1 : 0
						body.modules[moduleId]['multi_select'] = body.modules[moduleId]['multi_select'] == 'on' ? 1 : 0
						console.log(body.modules)
					}
				}
	
	
				try {					
					const result = await CampaignModule.batchUpdate(body.modules);										
					res.redirect("/admin/campaigns/" + campaignID + "/create/3");
				} catch (error){
					console.log(error)
					req.flash("error", error.message);
					res.redirect("/admin/campaigns/" + campaignID + "/create/2")
				}
			});
		

module.exports = router;