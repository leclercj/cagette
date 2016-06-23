package controller;
import sugoi.form.elements.StringInput;
import sugoi.form.validators.EmailValidator;


/**
 * Public pages controller
 */
class Group extends controller.Controller
{

	@tpl('group/view.mtt')
	function doDefault(group:db.Amap){
		
		view.group = group;
		view.contracts = group.getActiveContracts();
		if (app.user != null){
			
			view.isMember = Lambda.has(app.user.getAmaps(), group);
		}
	}
	
	/**
	 * register to a waiting list.
	 * 
	 * the user can be logged or not !
	 */
	@tpl('form.mtt')
	function doList(group:db.Amap){
		
		if (group.regOption != db.Amap.RegOption.WaitingList) throw Redirect("/group/" + group.id);
		if (app.user != null){
			if ( db.WaitingList.manager.select($amapId == group.id && $user == app.user) != null) throw Error("/group/" + group.id, "Vous êtes déjà sur la liste d'attente de ce groupe");
			if ( db.UserAmap.manager.select($amapId == group.id && $user == app.user) != null) throw Error("/group/" + group.id, "Vous faites déjà partie de ce groupe.");			
		}
		
		var form = new sugoi.form.Form("reg");				
		if (app.user == null){
			form.addElement(new StringInput("userFirstName", "Votre prénom","",true));
			form.addElement(new StringInput("userLastName", "Votre nom de famille","",true));
			form.addElement(new StringInput("userEmail", "Votre email", "", true));		
		}
		form.addElement(new sugoi.form.elements.TextArea("msg", "Laissez un message"));
		
		if (form.isValid()){
			
			if (app.user == null){
				var f = form;
				var user = new db.User();
				user.email = f.getValueOf("userEmail");
				user.firstName = f.getValueOf("userFirstName");
				user.lastName = f.getValueOf("userLastName");
				
				if ( db.User.getSimilar(user.firstName, user.lastName, user.email).length > 0 ) {
					throw Ok("/user/login","Vous êtes déjà enregistré dans Cagette.net, Connectez-vous à votre groupe à partir de cette page");
				}
				
				user.insert();
				app.session.setUser(user);
				
			}			
			
			var w = new db.WaitingList();
			w.user = app.user;
			w.group = group;
			w.message = form.getValueOf("msg");
			w.insert();
			
			throw Ok("/group/" + group.id,"Votre inscription en liste d'attente a été prise en compte. Vous serez prévenu par email lorsque votre demande sera traitée.");
		}
		
		view.title = "Inscription en liste d'attente à \"" + group.name+"\"";
		view.form = form;
		
	}
	
	
	/**
	 * register direclty in an open group
	 * 
	 * the user can be logged or not !
	 */
	@tpl('form.mtt')
	function doRegister(group:db.Amap){
		
		if (group.regOption != db.Amap.RegOption.Open) throw Redirect("/group/" + group.id);
		if (app.user != null){			
			if ( db.UserAmap.manager.select($amapId == group.id && $user == app.user) != null) throw Error("/group/" + group.id, "Vous faites déjà partie de ce groupe.");			
		}
		
		var form = new sugoi.form.Form("reg");	
		form.submitButtonLabel = "Rejoindre le groupe";
		form.addElement(new sugoi.form.elements.Html("Confirmez votre inscription à \""+group.name+"\""));
		if (app.user == null){
			form.addElement(new StringInput("userFirstName", "Votre prénom","",true));
			form.addElement(new StringInput("userLastName", "Votre nom de famille", "", true));
			var em = new StringInput("userEmail", "Votre email", "", true);
			em.addValidator(new EmailValidator());
			form.addElement(em);		
			form.addElement(new StringInput("address", "Adresse", "", true));					
			form.addElement(new StringInput("zipCode", "Code postal", "", true));		
			form.addElement(new StringInput("city", "Ville", "", true));		
			form.addElement(new StringInput("phone", "Téléphone", "", true));		
		}
		
		if (form.isValid()){
			
			if (app.user == null){
				var f = form;
				var user = new db.User();
				user.email = f.getValueOf("userEmail");
				user.firstName = f.getValueOf("userFirstName");
				user.lastName = f.getValueOf("userLastName");
				user.address1 = f.getValueOf("address");
				user.zipCode = f.getValueOf("zipCode");
				user.city = f.getValueOf("city");
				user.phone = f.getValueOf("phone");
				
				if ( db.User.getSimilar(user.firstName, user.lastName, user.email).length > 0 ) {
					throw Ok("/user/login","Vous êtes déjà enregistré dans Cagette.net, Connectez-vous à votre groupe à partir de cette page");
				}
				
				user.insert();				
				app.session.setUser(user);
				
			}			
			
			var w = new db.UserAmap();
			w.user = app.user;
			w.amap = group;
			w.insert();
			
			throw Ok("/user/choose","Votre inscription a été prise en compte.");
		}
		
		view.title = "Inscription à \"" + group.name+"\"";
		view.form = form;
		
	}
	
	/**
	 * create a new group
	 */
	@tpl("form.mtt")
	function doCreate() {
		
		view.title = "Créer un nouveau groupe sur Cagette.net";
		view.text = "Vous êtes sur le point de créer un compte pour votre AMAP ou groupement d'achat.";
		
		
		var f = new sugoi.form.Form("c");
		f.addElement(new StringInput("amapName", "Nom de votre groupe", "", true));
		//f.addElement(new sugoi.form.elements.Input("userFirstName", "Votre prénom","",true));
		//f.addElement(new sugoi.form.elements.Input("userLastName", "Votre nom de famille","",true));
		//f.addElement(new sugoi.form.elements.Input("userEmail", "Votre email", "", true));
		//var p = new sugoi.form.elements.Input("userPass", "Votre mot de passe", "", true);
		//p.password = true;
		//f.addElement(p);
		//f.addElement(new sugoi.form.elements.Input("userPhone", "Votre numéro de téléphone si vous souhaitez être rappellé","",false));
		
		if (f.checkToken()) {
			
			var user = app.user;
			
			var amap = new db.Amap();
			amap.name = f.getValueOf("amapName");
			amap.txtHome = "Bienvenue sur la cagette de "+amap.name+" !\n Vous pouvez consulter votre planning de distribution ou faire une nouvelle commande.";
			amap.contact = user;

			amap.flags.set(db.Amap.AmapFlags.HasMembership);
			amap.flags.set(db.Amap.AmapFlags.IsAmap);
			amap.insert();
			
			var ua = new db.UserAmap();
			ua.user = user;
			ua.amap = amap;
			ua.rights = [db.UserAmap.Right.AmapAdmin,db.UserAmap.Right.Membership,db.UserAmap.Right.Messages,db.UserAmap.Right.ContractAdmin(null)];
			ua.insert();
			
			//example datas
			var place = new db.Place();
			place.name = "Place du marché";
			place.amap = amap;
			place.insert();
			
			//contrat AMAP
			var vendor = new db.Vendor();
			vendor.amap = amap;
			vendor.name = "Jean Martin EURL";
			vendor.zipCode = "33210";
			vendor.city = "Langon";
			vendor.insert();			
			
			var contract = new db.Contract();
			contract.name = "Contrat AMAP Maraîcher Exemple";
			contract.description = "Ce contrat est un exemple de contrat maraîcher avec engagement à l'année comme on le trouve dans les AMAP.";
			contract.amap  = amap;
			contract.type = 0;
			contract.vendor = vendor;
			contract.startDate = Date.now();
			contract.endDate = DateTools.delta(Date.now(), 1000.0 * 60 * 60 * 24 * 364);
			contract.contact = user;
			contract.distributorNum = 2;
			contract.insert();
			
			var p = new db.Product();
			p.name = "Gros panier de légumes";
			p.price = 15;
			p.contract = contract;
			p.insert();
			
			var p = new db.Product();
			p.name = "Petit panier de légumes";
			p.price = 10;
			p.contract = contract;
			p.insert();
		
			var uc = new db.UserContract();
			uc.user = user;
			uc.product = p;
			uc.paid = true;
			uc.quantity = 1;
			uc.insert();
			
			var d = new db.Distribution();
			d.contract = contract;
			d.date = DateTools.delta(Date.now(), 1000.0 * 60 * 60 * 24 * 14);
			d.end = DateTools.delta(d.date, 1000.0 * 60 * 90);
			d.place = place;
			d.insert();
			
			
			//contrat variable
			var vendor = new db.Vendor();
			vendor.amap = amap;
			vendor.name = "Ferme de la Galinette";
			vendor.zipCode = "33430";
			vendor.city = "Bazas";
			vendor.insert();			
			
			var contract = new db.Contract();
			contract.name = "Contrat Poulet Exemple";
			contract.description = "Exemple de contrat à commande variable. Il permet de commander quelque chose de différent à chaque distribution.";
			contract.amap  = amap;
			contract.type = 1;
			contract.vendor = vendor;
			contract.startDate = Date.now();
			contract.endDate = DateTools.delta(Date.now(), 1000.0 * 60 * 60 * 24 * 364);
			contract.contact = user;
			contract.distributorNum = 2;
			contract.flags.set(db.Contract.ContractFlags.UsersCanOrder);
			contract.insert();
			
			var egg = new db.Product();
			egg.name = "Douzaine d'oeufs bio";
			egg.price = 5;
			egg.type = 6;
			egg.contract = contract;
			egg.insert();
			
			var p = new db.Product();
			p.name = "Poulet bio";
			p.type = 2;
			p.price = 9.50;
			p.contract = contract;
			p.insert();
			
			var d = new db.Distribution();
			d.contract = contract;
			d.orderStartDate = Date.now();
			d.orderEndDate = DateTools.delta(Date.now(), 1000.0 * 60 * 60 * 24 * 19);
			d.date = DateTools.delta(Date.now(), 1000.0 * 60 * 60 * 24 * 21);
			d.end = DateTools.delta(d.date, 1000.0 * 60 * 90);
			d.place = place;
			d.insert();
			
			var uc = new db.UserContract();
			uc.user = user;
			uc.product = egg;
			uc.paid = true;
			uc.quantity = 2;
			uc.distribution = d;
			uc.insert();
			
			var uc = new db.UserContract();
			uc.user = user;
			uc.product = p;
			uc.paid = true;
			uc.quantity = 1;
			uc.distribution = d;
			uc.insert();
			
			App.current.session.data.amapId  = amap.id;
			app.session.data.newGroup = true;
			throw Redirect("/");
		}
		
		view.form= f;
		
	}
	
	
}