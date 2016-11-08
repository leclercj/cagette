package controller;
import db.UserContract;
import haxe.Utf8;
import sugoi.form.elements.Selectbox;
import sugoi.form.Form;
import sugoi.form.validators.EmailValidator;
import neko.Web;
import sugoi.tools.Utils;
import ufront.mail.*;
import Common;


class Member extends Controller
{

	public function new()
	{
		super();
		if (!app.user.canAccessMembership()) throw Redirect("/");
		
		//var e = new event.Event();
		//e.id = "displayMember";
		//App.current.eventDispatcher.dispatch(e);
	}
	
	@logged
	@tpl('member/default.mtt')
	function doDefault(?args: { ?search:String, ?select:String } ) {
		checkToken();
		
		var browse:Int->Int->List<Dynamic>;
		var uids = db.UserAmap.manager.search($amap == app.user.getAmap(), false);
		var uids = Lambda.map(uids, function(ua) return ua.userId);
		if (args != null && args.search != null) {
			
			//SEARCH
			
			browse = function(index:Int, limit:Int) {
				var search = StringTools.trim(args.search);
				return db.User.manager.search( ($lastName.like(search)||$lastName2.like(search)) && $id in uids , { orderBy:-id }, false);
			}
			view.search = args.search;
			
		}else if(args!=null && args.select!=null){
			
			//SELECTION
			
			switch(args.select) {
				case "nocontract":
					if (app.params.exists("csv")) {
						sugoi.tools.Csv.printCsvData(Lambda.array(db.User.getUsers_NoContracts()), ["firstName", "lastName", "email"], "Sans-contrats");
						return;
					}else {
						browse = function(index:Int, limit:Int) { return db.User.getUsers_NoContracts(index, limit); }	
					}
				case "contract":
					
					if (app.params.exists("csv")) {
						sugoi.tools.Csv.printCsvData(Lambda.array(db.User.getUsers_Contracts()), ["firstName", "lastName", "email"], "Avec-commande");
						return;
					}else {
						browse = function(index:Int, limit:Int) { return db.User.getUsers_Contracts(index, limit); }	
					}
					
				case "nomembership" :
					if (app.params.exists("csv")) {
						sugoi.tools.Csv.printCsvData(Lambda.array(db.User.getUsers_NoMembership()), ["firstName", "lastName", "email"], "Adhesions-a-renouveller");
						return;
					}else {
						browse = function(index:Int, limit:Int) { return db.User.getUsers_NoMembership(index, limit); }
					}
				case "newusers" :
					if (app.params.exists("csv")) {
						sugoi.tools.Csv.printCsvData(Lambda.array(db.User.getUsers_NewUsers()), ["firstName", "lastName", "email"], "jamais-connecté");
						return;
					}else {
						browse = function(index:Int, limit:Int) { return db.User.getUsers_NewUsers(index, limit); }
					}
				default:
					throw "selection inconnue";
			}
			view.select = args.select;
			
		}else {
			if (app.params.exists("csv")) {
				var headers = ["firstName", "lastName", "email","phone", "firstName2", "lastName2","email2","phone2", "address1","address2","zipCode","city"];
				sugoi.tools.Csv.printCsvData(Lambda.array(db.User.manager.search( $id in uids, {orderBy:lastName}, false)), headers, "Adherents");
				return;
			}else {
				//default display
				browse = function(index:Int, limit:Int) {
					return db.User.manager.search( $id in uids, { limit:[index,limit], orderBy:lastName }, false);
				}
			}
			
			
		}
		
		var count = uids.length;
		var rb = new sugoi.tools.ResultsBrowser(count, (args.select!=null||args.search!=null)?1000:10, browse);
		view.members = rb;
		
		if (args.select == null || args.select != "newusers") {
			//count new users
			view.newUsers = db.User.getUsers_NewUsers().length;	
		}
		
		view.waitingList = db.WaitingList.manager.count($group == app.user.amap);
		
	}
	
	/**
	 * Move to waiting list
	 */
	function doMovetowl(u:db.User){
		
		var ua = db.UserAmap.get(u, app.user.amap, true);
		ua.delete();
		
		var wl = new db.WaitingList();
		wl.user = u;
		wl.group = app.user.amap;
		wl.insert();
		
		throw Ok("/member", u.getName() + " a été replacé en liste d'attente.");
		
		
	}
	
	@tpl('member/waiting.mtt')
	function doWaiting(?args:{?add:db.User,?remove:db.User}){
		
		if (args != null){
			
			if (args.add != null){
				//this user becomes member and is removed from waiting list
				var w = db.WaitingList.manager.select($user == args.add && $group == app.user.amap , true);
				
				var ua = new db.UserAmap();
				ua.amap = app.user.amap;
				ua.user = w.user;
				ua.insert();
				
				w.delete();
				
				throw Ok("/member/waiting", "Cette personne a bien été ajoutée aux adhérents");
				
			}else if (args.remove != null){
				
				//simply removed from waiting list
				
				var w = db.WaitingList.manager.select($user == args.remove && $group == app.user.amap , true);
				w.delete();
				
				throw Ok("/member/waiting", "Demande supprimée");
				
			}
			
		}
		
		
		view.waitingList = db.WaitingList.manager.search($group == app.user.amap,{orderBy:-date});
	}
	
	function doInviteMember(u:db.User){
		
		if (checkToken() ) {
			
			u.sendInvitation();
			throw Ok('/member/view/'+u.id, "Invitation envoyée.");
		}
		
	}
	
	/**
	 * Invite 'never logged' users
	 */
	function doInvite() {
		
		if (checkToken()) {
			
			var users = db.User.getUsers_NewUsers();
			for ( u in users) {
				u.sendInvitation();
				Sys.sleep(0.2);
			}
			
			throw Ok('/member', "Bravo, vous avez envoyé <b>" + users.length + "</b> invitations.");
		}
		
	}
	
	
	@tpl("member/view.mtt")
	function doView(member:db.User) {
		
		view.member = member;
		var userAmap = db.UserAmap.get(member, app.user.amap);
		if (userAmap == null) throw Error("/member", "Cette personne ne fait pas partie de votre groupe");
		
		view.userAmap = userAmap; 
		
		//orders
		var row = { constOrders:new Array<UserOrder>(), varOrders:new Map<String,Array<UserOrder>>() };
			
		//commandes fixes
		var contracts = db.Contract.manager.search($type == db.Contract.TYPE_CONSTORDERS && $amap == app.user.amap && $endDate > DateTools.delta(Date.now(),-1000.0*60*60*24*30), false);
		var orders = member.getOrdersFromContracts(contracts);
		row.constOrders = db.UserContract.prepare(orders);
		
		//commandes variables groupées par date de distrib
		var contracts = db.Contract.manager.search($type == db.Contract.TYPE_VARORDER && $amap == app.user.amap && $endDate > DateTools.delta(Date.now(),-1000.0*60*60*24*30), false);
		var distribs = new Map<String,List<db.UserContract>>();
		for (c in contracts) {
			var ds = c.getDistribs();
			for (d in ds) {
				var k = d.date.toString().substr(0, 10);
				var orders = member.getOrdersFromDistrib(d);
				if (orders.length > 0) {
					if (!distribs.exists(k)) {
						distribs.set(k, orders);
					}else {
						
						var v = distribs.get(k);
						for ( o in orders  ) v.add(o);
						distribs.set(k, v);
					}	
				}
			}
		}
		for ( k in distribs.keys()){
			var d = distribs.get(k);
			var d2 = db.UserContract.prepare(d);
			row.varOrders.set(k,d2);
		}
		
		
		view.userContracts = row;
		checkToken(); //to insert a token in tpl
		
	}	
	
	/**
	 * Admin : Log in as this user for debugging purpose
	 * @param	user
	 * @param	amap
	 */	
	@admin
	function doLoginas(user:db.User, amap:db.Amap) {
	
		//if (!app.user.isAmapManager()) return;
		//if (user.isAdmin()) return;
		
		App.current.session.setUser(user);
		App.current.session.data.amapId = amap.id;
		throw Redirect("/member/view/" + user.id );
	}
	
	/**
	 * Edit a Member
	 */
	@tpl('form.mtt')
	function doEdit(member:db.User) {
		
		if (member.isAdmin() && !app.user.isAdmin()) throw Error("/","Vous ne pouvez pas modifier le compte d'un administrateur");
		
		var form = sugoi.form.Form.fromSpod(member);
		
		//cleaning
		form.removeElement( form.getElement("pass") );
		form.removeElement( form.getElement("rights") );
		form.removeElement( form.getElement("lang") );		
		form.removeElement( form.getElement("ldate") );
		form.removeElementByName("email");
		form.removeElementByName("email2");
		
		if (form.checkToken()) {
			
			//update model
			form.toSpod(member); 
			
			//check that the given emails are not already used elsewhere
			var sim = db.User.getSameEmail(member.email,member.email2);
			for ( s in sim) {				
				if (s.id == member.id) sim.remove(s);
			}
			if (sim.length > 0) {
				
				//Let's merge the 2 users if it has no orders.
				var id = sim.first().id;
				if (UserContract.manager.search( $userId == id || $userId2 == id , false).length == 0) {
					//merge
					member.merge( sim.first() );
					app.session.addMessage("Cet email était utilisé dans une autre fiche de membre, comme cette fiche etait inutilisée, elle a été fusionnée avec la fiche courante.");
					
				} else {
					throw Error("/member/edit/" + member.id, "Attention, Cet email ou ce nom existe déjà dans une autre fiche : "+Lambda.map(sim,function(u) return "<a href='/member/view/"+u.id+"'>"+u.getCoupleName()+"</a>. Ces deux fiches ne peuvent pas être fusionnées car cette personne a des commandes enregistrées dans l'autre fiche").join(","));	
				}
			}			
			
			member.update();
			
			/*if (!App.config.DEBUG) {
				//verif changement d'email
				if (form.getValueOf("email") != member.email) {
					var m = new Email();
					m.from(new EmailAddress(App.config.get("default_email"),"Cagette.net"));
					m.to(new EmailAddress(member.email));
					m.setSubject("Changement d'email sur votre compte Cagette.net");
					m.setHtml( app.processTemplate("mail/message.mtt", { text:app.user.getName() + " vient de modifier votre email sur votre fiche Cagette.net.<br/>Votre email est maintenant : "+form.getValueOf("email")  } ) );
					App.getMailer().send(m);
					
				}
				if (form.getValueOf("email2") != member.email2 && member.email2!=null) {
					var m = new Email();
					m.from(new EmailAddress(App.config.get("default_email"),"Cagette.net"));
					m.to(new EmailAddress(member.email2));
					m.setSubject("Changement d'email sur votre compte Cagette.net");
					m.setHtml( app.processTemplate("mail/message.mtt", { text:app.user.getName() + " vient de modifier votre email sur votre fiche Cagette.net.<br/>Votre email est maintenant : "+form.getValueOf("email2")  } ) );
					App.getMailer().send(m);
				}	
			}*/
			
			throw Ok('/member/view/'+member.id,'Ce membre a été mis à jour');
		}
		
		view.form = form;
	}
	
	/**
	 * Remove a user from this group
	 */
	function doDelete(user:db.User,?args:{confirm:Bool,token:String}) {
		
		if (checkToken()) {
			if (!app.user.canAccessMembership()) throw "Vous ne pouvez pas faire ça.";
			if (user.id == app.user.id) throw Error("/member/view/"+user.id,"Vous ne pouvez pas vous effacer vous même.");
			if ( user.getOrders(app.user.amap).length > 0 && !args.confirm) {
				throw Error("/member/view/"+user.id,"Attention, ce compte a des commandes en cours. <a class='btn btn-default btn-xs' href='/member/delete/"+user.id+"?token="+args.token+"&confirm=1'>Effacer quand-même</a>");
			}
		
			var ua = db.UserAmap.get(user, app.user.amap, true);
			if (ua != null) {
				ua.delete();
				throw Ok("/member", user.getName() + " a bien été supprimé(e) de votre groupe");
			}else {
				throw Error("/member", "Cette personne ne fait pas partie de \"" + app.user.amap.name+"\"");			
			}	
		}else {
			throw Redirect("/member/view/"+user.id);
		}
	}
	
	@tpl('form.mtt')
	function doMerge(user:db.User) {
		
		if (!app.user.canAccessMembership()) throw Error("/","Action interdite");
		
		view.title = "Fusionner un compte avec un autre";
		view.text = "Cette action permet de fusionner deux comptes ( quand vous avez des doublons dans la base de données par exemple).<br/>Les contrats du compte 2 seront rattachés au compte 1, puis le compte 2 sera effacé.<br/>Attention cette action n'est pas annulable.";
		
		var form = new Form("merge");
		
		var members = app.user.amap.getMembers();
		var members = Lambda.array(Lambda.map(members, function(x) return { key:Std.string(x.id), value:x.getName() } ));
		var mlist = new Selectbox("member1", "Compte 1", members, Std.string(user.id));
		form.addElement( mlist );
		var mlist = new Selectbox("member2", "Compte 2", members);
		form.addElement( mlist );
		
		if (form.checkToken()) {
		
			var m1 = Std.parseInt(form.getElement("member1").value);
			var m2 = Std.parseInt(form.getElement("member2").value);
			var m1 = db.User.manager.get(m1,true);
			var m2 = db.User.manager.get(m2,true);
			
			//if (m1.amapId != m2.amapId) throw "ils ne sont pas de la même amap !";
			
			//on prend tout à m2 pour donner à m1			
			//change usercontracts
			var contracts = db.UserContract.manager.search($user==m2 || $user2==m2,true);
			for (c in contracts) {
				if (c.user.id == m2.id) c.user = m1;
				if (c.user2!=null && c.user2.id == m2.id) c.user2 = m1;
				c.update();
			}
			
			//group memberships
			var adh = db.UserAmap.manager.search($user == m2, true);
			for ( a in adh) {
				a.user = m1;
				a.update();
			}
			
			//change contacts
			var contacts = db.Contract.manager.search($contact==m2,true);
			for (c in contacts) {
				c.contact = m1;
				c.update();
			}
			//if (m2.amap.contact == m2) {
				//m1.amap.lock();
				//m1.amap.contact = m1;
				//m1.amap.update();
			//}
			
			m2.delete();
			
			throw Ok("/member/view/" + m1.id, "Les deux comptes ont été fusionnés");
			
			
		}
		
		view.form = form;
		
	}
	
	
	@tpl('member/import.mtt')
	function doImport(?args: { confirm:Bool } ) {
		
		var step = 1;
		var request = Utils.getMultipart(1024 * 1024 * 4); //4mb
		
		//on recupere le contenu de l'upload
		var data = request.get("file");
		if ( data != null) {
			
			var csv = new sugoi.tools.Csv();
			csv.headers = ["prénom","nom","E-mail","téléphone portable","prénom conjoint","	nom conjoint","	E-mail conjoint",	"téléphone portable conjoint",	"adresse1",	"adresse2"	,"code postal","ville"];
			var unregistred = csv.importDatas(data);
			
			//cleaning
			for ( user in unregistred.copy() ) {
				
				//check nom+prenom
				if (user[0] == null || user[1] == null) throw Error("/member/import","Vous devez remplir le nom et prénom de la personne. Cette ligne est incomplète : " + user);
				if (user[2] == null) throw Error("/member/import","Chaque personne doit avoir un email, sinon elle ne pourra pas se connecter. "+user[0]+" "+user[1]+" n'en a pas. "+user);
				//uppercase du nom
				if (user[1] != null) user[1] = user[1].toUpperCase();
				if (user[5] != null) user[5] = user[5].toUpperCase();
				//lowercase email
				if (user[2] != null) user[2] = user[2].toLowerCase();
				if (user[6] != null) user[6] = user[6].toLowerCase();
			}
			
			//utf-8 check
			for ( row in unregistred.copy()) {
				
				for ( i in 0...row.length) {
					var t = row[i];
					if (t != "" && t != null) {
						try{
							if (!Utf8.validate(t)) {
								t = Utf8.encode(t);	
							}
						}catch (e:Dynamic) {}
						row[i] = t;
					}
				}
			}
			
			//put already registered people in another list
			var registred = [];
			for (r in unregistred.copy()) {
				var firstName = r[0];
				var lastName = r[1];
				var email = r[2];
				var firstName2 = r[4];
				var lastName2 = r[5];
				var email2 = r[6];
				
				var us = db.User.getSameEmail(email, email2);
				
				if (us.length > 0) {
					unregistred.remove(r);
					registred.push(r);
				}
			}
			
			
			app.session.data.csvUnregistered = unregistred;
			app.session.data.csvRegistered = registred;
			
			view.data = unregistred;
			view.data2 = registred;
			step = 2;
		}
		
		
		if (args != null && args.confirm) {
			
			//import unregistered members
			var i : Iterable<Dynamic> = cast app.session.data.csvUnregistered;
			for (u in i) {
				if (u[0] == null || u[0] == "") continue;
								
				var user = new db.User();
				user.firstName = u[0];
				user.lastName = u[1];
				user.email = u[2];
				if (user.email != null && !EmailValidator.check(user.email)) {
					throw "Le mail '" + user.email + "' est invalide, merci de modifier votre fichier";
				}
				user.phone = u[3];
				
				user.firstName2 = u[4];
				user.lastName2 = u[5];
				user.email2 = u[6];
				if (user.email2 != null && !EmailValidator.check(user.email2)) {
					App.log(u);
					throw "Le mail du conjoint de "+user.firstName+" "+user.lastName+" '" + user.email2 + "' est invalide, merci de modifier votre fichier";
				}
				user.phone2 = u[7];
				
				user.address1 = u[8];
				user.address2 = u[9];
				user.zipCode = u[10];
				user.city = u[11];
				
				user.insert();
				
				var ua = new db.UserAmap();
				ua.user = user;
				ua.amap = app.user.amap;
				ua.insert();
			}
			
			//import registered members
			var i : Iterable<Dynamic> = cast app.session.data.csvRegistered;
			for (u in i) {
				var firstName = u[0];
				var lastName = u[1];
				var email = u[2];
				var firstName2 = u[4];
				var lastName2 = u[5];
				var email2 = u[6];
				
				var us = db.User.getSameEmail(email, email2);
				var userAmaps = db.UserAmap.manager.search($amap == app.user.amap && $userId in Lambda.map(us, function(u) return u.id), false);
				
				if (userAmaps.length == 0) {
					//il existe dans cagette, mais pas pour ce groupe
					var ua = new db.UserAmap();
					ua.userId = us.first().id;
					ua.amap = app.user.amap;
					ua.insert();
				}
				
				
			}
			
			view.numImported = app.session.data.csvUnregistered.length + app.session.data.csvRegistered.length;
			app.session.data.csvUnregistered = null;
			app.session.data.csvRegistered = null;
			
			step = 3;
		}
		
		if (step == 1) {
			//reset import when back to import page
			app.session.data.csvUnregistered = null;
			app.session.data.csvRegistered = null;
		}
		
		view.step = step;
	}
	
	@tpl("user/insert.mtt")
	public function doInsert() {
		
		if (!app.user.canAccessMembership()) throw Error("/","Action interdite");
		
		var m = new db.User();
		var form = sugoi.form.Form.fromSpod(m);
		form.removeElement(form.getElement("lang"));
		form.removeElement(form.getElement("rights"));
		form.removeElement(form.getElement("pass"));	
		form.removeElement(form.getElement("ldate") );
		form.addElement(new sugoi.form.elements.Checkbox("warnAmapManager", "Envoyer un mail au responsable du groupe", true));
		form.getElement("email").addValidator(new EmailValidator());
		form.getElement("email2").addValidator(new EmailValidator());
		
		if (form.isValid()) {
			
			//check doublon de User et de UserAmap
			var userSims = db.User.getSameEmail(form.getValueOf("email"),form.getValueOf("email2"));
			view.userSims = userSims;
			var userAmaps = db.UserAmap.manager.search($amap == app.user.amap && $userId in Lambda.map(userSims, function(u) return u.id), false);
			view.userAmaps = userAmaps;
			
			if (userAmaps.length > 0) {
				//user deja enregistré dans cette amap
				throw Error('/member/view/' + userAmaps.first().userId, 'Cette personne est déjà inscrite dans cette AMAP');
				
			}else if (userSims.length > 0) {
				//des users existent avec ce nom , 
				if (userSims.length == 1) {
					// si yen a qu'un on l'inserte
					var ua = new db.UserAmap();
					ua.user = userSims.first();
					ua.amap = app.user.amap;
					ua.insert();	
					throw Ok('/member/','Cette personne était déjà inscrite sur Cagette.net, nous l\'avons inscrite à votre groupe.');
				}else {
					//demander validation avant d'inserer le userAmap
					
					//TODO
					
					throw Error('/member',"Impossible d'ajouter cette personne car plusieurs personnes dans la base de données ont le même nom et prénom, contactez l'administrateur du site."+userSims);
					
				}
				return;
			}else {
				//insert user
				var u = new db.User();
				form.toSpod(u); 
				u.lang = "fr";
				u.insert();
				
				//insert userAmap
				var ua = new db.UserAmap();
				ua.user = u;
				ua.amap = app.user.getAmap();
				ua.insert();	
				
				if (form.getValueOf("warnAmapManager") == "1") {
					
					try{					
						var m = new Email();
						m.from(new EmailAddress(App.config.get("default_email"),"Cagette.net"));					
						m.to(new EmailAddress(app.user.getAmap().contact.email));					
						m.setSubject( app.user.amap.name+" - Nouvel inscrit : " + u.getCoupleName() );
						var text = app.user.getName() + " vient de saisir la fiche d'une nouvelle personne  : <br/><strong>" + u.getCoupleName() + "</strong><br/> <a href='http://app.cagette.net/member/view/" + u.id + "'>voir la fiche</a> ";
						m.setHtml( app.processTemplate("mail/message.mtt", { text:text } ) );
						App.getMailer().send(m);
					
					}catch(e:Dynamic){}
				}
				
				throw Ok('/member/','Cette personne a bien été enregistrée');
				
			}
		}
		
		view.form = form;
	
		
	}
	
}