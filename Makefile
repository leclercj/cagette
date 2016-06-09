ROPTS=-zav --no-p --chmod=u=rwX,g=rX,o= --delete --exclude=www/.htaccess --exclude=.svn --exclude=.git --exclude=*.mtt --exclude=tpl/css --exclude=www/file --exclude=*node_modules*
LANG=fr

compile:
	haxe project.hxml

css:
	hss hss/*.hss -output www/css/

templates:
	(cd lang/$(LANG)/tpl; temploc2 -macros macros.mtt -output ../tmp/ *.mtt */*.mtt */*/*.mtt */*/*/*.mtt)

templates_php:
	(cd lang/$(LANG)/tpl; temploc2 -php -macros macros.mtt -output ../tmp/ *.mtt */*.mtt */*/*.mtt)

deploy: 
	#compile
	#css
	@make LANG=fr templates
	@make LANG=fr deploy_site deploy_tpl

deploy_site:
	rsync $(ROPTS) www www-data@www.cagette.net:/data/cagette/

deploy_tpl:
	rsync $(ROPTS) lang/$(LANG) www-data@www.cagette.net:/data/cagette/lang/

bundle:
	@make LANG=fr templates
	haxe cagette.hxml
	rm -rf www/file/*.jpg
	tar -cvf cagette.tar www config.xml.dist lang --exclude www/bower_components/bootstrap/node_modules
	scp cagette.tar www-data@cagette.net:/data/cagetteSite/www/
	rm cagette.tar
	
cp_plugin:
	cp -R lang/fr/tpl/plugin/hosted/* ~/projects/haxeLibs/cagette-hosted/git/src/hosted/lang/fr/tpl/hosted/


bundle_php:
	@make LANG=fr templates_php
	haxe cagette-php.hxml
	tar -cvf cagette-php.tar www config.xml.dist lang --exclude www/bower_components/bootstrap/node_modules
	scp cagette-php.tar www-data@cagette.net:/data/cagetteSite/www/
	rm cagette-php.tar




	