const router = require('express').Router({mergeParams: true});
const User = require("../../models/user");
const Company = require("../../models/company");
const Campaign = require("../../models/campaign");
const Dashboard = require("../../models/dashboard");

const authenticate = require("../../lib/authenticators")

router.get("/", authenticate.admin, async (req, res) => {
	let [stats, data] = await Promise.all([Dashboard.get(), Campaign.getAll({completed: 1, status: 1})]);
	res.render('./dashboard/index', {title: "Dashboard", data, stats: stats.data()});
});

module.exports = router;