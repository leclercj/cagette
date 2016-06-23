package controller;
import db.UserContract;
import sugoi.form.Form;
import sugoi.form.elements.HourDropDowns;
using tools.DateTool;

class Distribution extends Controller
{

	public function new()
	{
		super();
		
	}
	
	/**
	 * Liste d'émargement
	 */
	@tpl('distribution/list.mtt')
	function doList(d:db.Distribution) {
		view.distrib = d;
		var contract = d.contract;
		view.contract = d.contract;
		view.orders = UserContract.prepare(d.getOrders());
	}
	
	/**
	 * Liste d'émargement globale pour une date donnée (multi fournisseur)
	 */
	@tpl('distribution/listByDate.mtt')
	function doListByDate(?date:Date,?type:String) {
		
		if (type == null) {
		
			var f = new sugoi.form.Form("listBydate", null, sugoi.form.Form.FormMethod.GET);
			//f.addElement(new sugoi.form.elements.DatePicker("date", "Date de distribution",date));
			f.addElement(new sugoi.form.elements.RadioGroup("type", "Affichage", [
				{ key:"one", value:"Une personne par page" },
				{ key:"all", value:"Tout à la suite" },
				//{ key:"csv", value:"Export CSV" }
			]));
			
			view.form = f;
			app.setTemplate("form.mtt");
			
			if (f.checkToken()) {
				
				var url = '/distribution/listByDate/' + date.toString().substr(0, 10)+"/"+f.getValueOf("type");
				throw Redirect( url );
			}
			
			return;
			
		}else {
			view.date = date;
			
			if (type=="one") {
				app.setTemplate("distribution/listByDateOnePage.mtt");
			}
			
			var d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
			var d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
			var contracts = app.user.amap.getActiveContracts(true);
			var cids = Lambda.map(contracts, function(c) return c.id);
			var cconst = [];
			var cvar = [];
			for ( c in contracts) {
				if (c.type == db.Contract.TYPE_CONSTORDERS) cconst.push(c.id);
				if (c.type == db.Contract.TYPE_VARORDER) cvar.push(c.id);
			}
			
			//commandes variables
			var distribs = db.Distribution.manager.search(($contractId in cvar) && $date >= d1 && $date <= d2 , false);		
			var orders = db.UserContract.manager.search($distributionId in Lambda.map(distribs, function(d) return d.id)  , { orderBy:userId } );
			
			//commandes fixes
			var distribs = db.Distribution.manager.search(($contractId in cconst) && $date >= d1 && $date <= d2 , false);	
			var products = [];
			for ( d in distribs) {
				for ( p in d.contract.getProducts()) {
					products.push(p);
				}
			}
			var orders2 = db.UserContract.manager.search($productId in Lambda.map(products, function(d) return d.id)  , { orderBy:userId } );
			
			var orders = Lambda.array(orders).concat(Lambda.array(orders2));
			var orders3 = db.UserContract.prepare(Lambda.list(orders));
			view.orders = orders3;
			
			if (type == "csv") {
				var data = new Array<Dynamic>();
				
				for (o in orders3) {
					data.push( { 
						"name":o.userName,
						"productName":o.productName,
						"price":view.formatNum(o.productPrice),
						"quantity":o.quantity,
						"fees":view.formatNum(o.fees),
						"total":view.formatNum(o.total),
						"paid":o.paid
					});				
				}

				setCsvData(data, ["name",  "productName", "price", "quantity","fees","total", "paid"],"Export-commandes-"+date.toString().substr(0,10)+"-Cagette");
				return;	
			}
			
		}
		
	}
	
	
	
	function doDelete(d:db.Distribution) {
		
		if (!app.user.canManageContract(d.contract)) throw "action non autorisée";		
		if (db.UserContract.manager.search($distributionId == d.id, false).length > 0) throw Error("/contractAdmin/distributions/" + d.contract.id, "Effacement impossible : Des commandes sont enregistrées pour cette distribution.");
		
		d.lock();
		var cid = d.contract.id;
		d.delete();
		throw Ok("/contractAdmin/distributions/" + cid, "la distribution a bien été effacée");
	}
	
	/**
	 * Edit a delivery
	 */
	@tpl('form.mtt')
	function doEdit(d:db.Distribution) {
		
		if (!app.user.canManageContract(d.contract)) throw "action non autorisée";
		
		var form = sugoi.form.Form.fromSpod(d);
		form.removeElement(form.getElement("contractId"));
		form.removeElement(form.getElement("end"));
		form.removeElement(form.getElement("distributionCycleId"));
		var x = new sugoi.form.elements.HourDropDowns("end", "heure de fin",d.end,true);
		form.addElement(x, 4);
		
		if (d.contract.type == db.Contract.TYPE_VARORDER ) {
			form.addElement(new sugoi.form.elements.DatePicker("orderStartDate", App.t._("orderStartDate"), d.orderStartDate));	
			form.addElement(new sugoi.form.elements.DatePicker("orderEndDate", App.t._("orderEndDate"), d.orderEndDate));
		}
		
		if (form.isValid()) {
			form.toSpod(d); //update model
			
			if (d.contract.type == db.Contract.TYPE_VARORDER ) checkDistrib(d);
			
			//var days = Math.floor( d.date.getTime() / 1000 / 60 / 60 / 24 );
			d.end = new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate(), d.end.getHours(), d.end.getMinutes(), 0);
			d.update();
			throw Ok('/contractAdmin/distributions/'+d.contract.id,'La distribution a été mise à jour');
		}
		
		view.form = form;
		view.title = "Modifier une distribution";
	}
	
	@tpl('form.mtt')
	function doEditCycle(d:db.DistributionCycle) {
		
		var form = sugoi.form.Form.fromSpod(d);
		form.removeElement(form.getElement("contractId"));
		
		if (form.isValid()) {
			form.toSpod(d); //update model
			d.update();
			throw Ok('/contractAdmin/distributions/'+d.contract.id,'La distribution a été mise à jour');
		}
		
		view.form = form;
		view.title = "Modifier une distribution";
	}
	
	@tpl("form.mtt")
	public function doInsert(contract:db.Contract) {
		
		var d = new db.Distribution();
		var form = sugoi.form.Form.fromSpod(d);
		form.removeElement(form.getElement("contractId"));
		form.removeElement(form.getElement("distributionCycleId"));
		form.removeElement(form.getElement("end"));
		var x = new sugoi.form.elements.HourDropDowns("end", "heure de fin");
		form.addElement(x, 4);
		
		//default values
		form.getElement("date").value = DateTool.now().deltaDays(30).setHourMinute(19, 0);
		form.getElement("end").value = DateTool.now().deltaDays(30).setHourMinute(20, 0);
		
		
		if (contract.type == db.Contract.TYPE_VARORDER ) {
			form.addElement(new sugoi.form.elements.DatePicker("orderStartDate", App.t._("orderStartDate"),DateTool.now().deltaDays(10).setHourMinute(8, 0)));	
			form.addElement(new sugoi.form.elements.DatePicker("orderEndDate", App.t._("orderEndDate"),DateTool.now().deltaDays(20).setHourMinute(23, 59)));
		}
		
		if (form.isValid()) {
			
			form.toSpod(d); //update model
			d.contract = contract;			
			if (d.end == null) d.end = DateTools.delta(d.date, 1000.0 * 60 * 60);
			d.end = new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate(), d.end.getHours(), d.end.getMinutes(), 0);
			
			checkDistrib(d);
			
			d.insert();
			throw Ok('/contractAdmin/distributions/'+d.contract.id,'La distribution a été enregistrée');
		}
	
		view.form = form;
		view.title = "Programmer une nouvelle distribution";
	}
	
	/**
	 * checks if dates are correct
	 * @param	d
	 */
	function checkDistrib(d:db.Distribution) {
		var c = d.contract;
		
		if (d.date.getTime() > c.endDate.getTime()) throw Error('/contractAdmin/distributions/' + c.id, "La date de distribution doit être antérieure à la date de fin du contrat ("+view.hDate(c.endDate)+")");
		if (d.date.getTime() < c.startDate.getTime()) throw Error('/contractAdmin/distributions/' + c.id, "La date de distribution doit être postérieure à la date de début du contrat ("+view.hDate(c.startDate)+")");
		
		if (c.type == db.Contract.TYPE_VARORDER ) {
			if (d.date.getTime() < d.orderEndDate.getTime() ) throw Error('/contractAdmin/distributions/' + d.contract.id, "La date de distribution doit être postérieure à la date de fermeture des commandes");
			if (d.orderStartDate.getTime() > d.orderEndDate.getTime() ) throw Error('/contractAdmin/distributions/' + d.contract.id, "La date de fermeture des commandes doit être postérieure à la date d'ouverture des commandes !");
		
		}
		
		
	}
	
	@tpl("form.mtt")
	public function doInsertCycle(contract:db.Contract) {
		
		var d = new db.DistributionCycle();
		var form = sugoi.form.Form.fromSpod(d);
		form.removeElementByName("contractId");
		
		form.getElement("startDate").value = DateTool.now();
		form.getElement("endDate").value  = DateTool.now().deltaDays(30);
		
		//start hour
		form.removeElementByName("startHour");
		var x = new HourDropDowns("startHour", "Heure de début", DateTool.now().setHourMinute( 19, 0) , true);
		form.addElement(x, 5);
		
		//end hour
		form.removeElement(form.getElement("endHour"));
		var x = new HourDropDowns("endHour", "Heure de fin", DateTool.now().setHourMinute(20, 0), true);
		form.addElement(x, 6);
		
		if (contract.type == db.Contract.TYPE_VARORDER){
			
			form.getElement("daysBeforeOrderStart").value = 10;
			form.getElement("daysBeforeOrderStart").required = true;
			form.removeElementByName("openingHour");
			var x = new HourDropDowns("openingHour", "Heure d'ouverture", DateTool.now().setHourMinute(8, 0) , true);
			form.addElement(x, 8);
			
			form.getElement("daysBeforeOrderEnd").value = 2;
			form.getElement("daysBeforeOrderEnd").required = true;
			form.removeElementByName("closingHour");
			var x = new HourDropDowns("closingHour", "Heure de fermeture", DateTool.now().setHourMinute(23, 0) , true);
			form.addElement(x, 10);
			
		}else{
			
			form.removeElementByName("daysBeforeOrderStart");
			form.removeElementByName("daysBeforeOrderEnd");	
			form.removeElementByName("openingHour");
			form.removeElementByName("closingHour");
		}
		
		
		if (form.isValid()) {
			
			form.toSpod(d); //update model			
			d.contract = contract;
			d.insert();
			
			var c = contract;
			if (d.endDate.getTime() > c.endDate.getTime()) throw Error('/distribution/insertCycle/' + c.id, "La date de fin doit être antérieure à la date de fin du contrat ("+view.hDate(c.endDate)+")");
			if (d.startDate.getTime() < c.startDate.getTime()) throw Error('/distribution/insertCycle/' + c.id, "La date de début doit être postérieure à la date de début du contrat ("+view.hDate(c.startDate)+")");
		
			
			db.DistributionCycle.updateChilds(d);
			throw Ok('/contractAdmin/distributions/'+d.contract.id,'La distribution a été enregistrée');
		}
		
		view.form = form;
		view.title = "Programmer une distribution récurrente";
	}
	
	/**
	 * Doodle like
	 */
	@tpl("distribution/planning.mtt")
	public function doPlanning(contract:db.Contract) {
	
		view.contract = contract;

		var doodle = new Map<Int,{user:db.User,planning:Map<Int,Bool>}>();
		var distribs = contract.getDistribs(true, 150);
		
		for ( d in distribs ) {
			for (u in [d.distributor1, d.distributor2, d.distributor3, d.distributor4]) {
				if (u != null) {
					
					var udoodle = doodle.get(u.id);
					
					if (udoodle == null) udoodle = { user:u, planning:new Map<Int,Bool>() };
					udoodle.planning.set(d.id, true);
					doodle.set(u.id, udoodle);
					
				}
			}
			
		}
		view.distribs = distribs;
		view.doodle = doodle;
		
	}
	
	/**
	 * ajax pour doodle/planning
	 */
	public function doRegister(args: { register:Bool, distrib:db.Distribution } ) {
		
		if (args != null) {
			var d = args.distrib;
			d.lock();
			
			if (args.register) {
				
				if (d.distributor1 == null) d.distributor1 = app.user;
				else if (d.distributor2 == null) d.distributor2 = app.user;
				else if (d.distributor3 == null) d.distributor3 = app.user;
				else if (d.distributor4 == null) d.distributor4 = app.user;
				
			}else {
				if (d.distributor1 == app.user) d.distributor1 = null;
				else if (d.distributor2 == app.user) d.distributor2 = null;
				else if (d.distributor3 == app.user) d.distributor3 = null;
				else if (d.distributor4 == app.user) d.distributor4 = null;
			}
			
			
			d.update();
		}
		
	}
	
}