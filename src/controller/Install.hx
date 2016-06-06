package controller;
import sugoi.form.elements.StringInput;

/**
 * ...
 * @author fbarbut<francois.barbut@gmail.com>
 */
class Install
{

	@tpl("form.mtt")
	function doDefault() {
		if (db.User.manager.get(1) == null) {
						
			view.title = "Installation de Cagette.net";

			var f = new sugoi.form.Form("c");
			f.addElement(new StringInput("amapName", "Nom de votre groupement","",true));
			f.addElement(new StringInput("userFirstName", "Votre prénom","",true));
			f.addElement(new StringInput("userLastName", "Votre nom de famille","",true));

			if (f.checkToken()) {
	
				var user = new db.User();
				user.firstName = f.getValueOf("userFirstName");
				user.lastName = f.getValueOf("userLastName");
				user.email = "admin@cagette.net";
				user.setPass("admin");
				user.insert();
			
				var amap = new db.Amap();
				amap.name = f.getValueOf("amapName");
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
				
				var vendor = new db.Vendor();
				vendor.amap = amap;
				vendor.name = "Jean Martin EURL";
				vendor.insert();
				
				var contract = new db.Contract();
				contract.name = "Contrat Maraîcher Exemple";
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
				
				App.current.user = null;
				App.current.session.setUser(user);
				App.current.session.data.amapId  = amap.id;
				
				app.session.data.newGroup = true;
				throw Ok("/", "Groupe et utilisateur 'admin' créé. Votre email est 'admin@cagette.net' et votre mot de passe est 'admin'");
			}	
			
			view.form= f;
			
		}else {
			throw Error("/", "L'utilisateur admin a déjà été créé. Essayez de vous connecter avec admin@cagette.net, mot de passe : admin");
		}
	}
	
}