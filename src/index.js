/*

	BLUEPRINTS
	
*/
module.exports = function($digger){

	var blueprints = {};
	var holder = null;

	function ensure_holder(){
		if(!holder){
			holder = $digger.create();
		}
		return holder;
	}

	var api = {
		inject:function(blueprints){
			var self = this;
			blueprints.find('blueprint').each(function(blueprint){
        self.add(blueprint);
      })
      blueprints.find('template').each(function(template){
        self.add_template(template.attr('name'), template.attr('html'));
      })
		},
		/*
		
			connect to a backend warehouse and load blueprint and template containers

			then add them to the client
			
		*/
		load:function(warehouses, done){
			var self = this;
			
			var blueprintwarehouse = $digger.connect(warehouses);
	    blueprintwarehouse('blueprint:tree')
	      .ship(function(blueprints){
	      	self.inject(blueprints);
	        
	        done && done();
	      })
		},
		// point to static XML files and process them on the client
		// this means we can load blueprints from plugins
		loadstatic:function(warehouses, done){
			var self = this;
			if(typeof(warehouses)=='string'){
				warehouses = [warehouses];
			}

			var urls = [].concat(warehouses);

			function load_next(){
				if(urls.length<=0){
					done && done();
					return;
				}
				var url = urls.pop();

				$digger.emit('http', {
					method:'GET',
					url:url
				}, function(error, res, body){

					if(error){
						console.error(error);
						return;
					}
					var blueprintfolder = $digger.create(body);
					self.inject(blueprintfolder);
					load_next();
				})
			}

			load_next();
		},
		build_default:function(container){
			var blueprint = $digger.create('blueprint');

			Object.keys(container.attr() || {}).forEach(function(prop){
				if(prop.indexOf('_')!=0){
					var field = $digger.create('field', {
						name:prop
					})
					blueprint.append(field);
				}
			})

			this.process(blueprint);

			return blueprint;
		},
		reset:function(){
			blueprints = {};
			holder = $digger.create();
		},
		/*
		
			add a single blueprint container

			we process the blueprint into raw model data for digger-form-for-angular

			take the top level fields as the simple form

			take each tab which is:

			 a) a single field tab
			 b) a form within a tab

		*/
	  add:function(blueprint){
	  	this.process(blueprint);
	  	ensure_holder();
	  	holder.add(blueprint);
	  	blueprints[blueprint.title()] = blueprint;
	  	$digger.emit('blueprint', blueprint);
	  	
	    return this;
	  },
	  // turn the container children into field and tab arrays
	  process:function(blueprint){

	  	// write the options
	  	function map_field(field){
	  		var ret = field.get(0);
	  		ret.options = field.find('option').map(function(o){
	  			return o.attr('value');
	  		})
	  		return ret;
	  	}

  		if(typeof(blueprint.find)==='function'){
  			var tabs = blueprint.find('tab');

  			// only get fields at the top otherwise we suck up tab fields too
  			var fields = blueprint.find('> field').map(map_field);

  			/*
  			
  				turn the tab container into tab model with fields processed
  				
  			*/
  			var tabs = blueprint.find('tab').map(function(tab){

  				var model = tab.get(0);

  				// the whole tab is a field
  				if(tab.attr('type')){
  					return model;
  				}
  				// the tab is a list of fields
  				else{
  					model.fields = tab.find('field').map(map_field);
  				}

  				return model;
  			})

  			// this is the simple flat view of all fields
  			blueprint.fields = fields;
  			blueprint.tabs = tabs;
  		}
  		else{
  			blueprint.fields = [];
  		}

	  },
	  has_children:function(for_blueprint){
	  	if(!for_blueprint || !for_blueprint.attr){
	  		return true;
	  	}
	  	if(!for_blueprint || !for_blueprint.attr('leaf')){
	  		return true;
	  	}
	  	else{
	  		return false;
	  	}
	  },
	  filter_children:function(blueprint_list, parent_blueprint){
	  	
	  	if(!parent_blueprint){
	  		return blueprint_list;
	  	}

	  	if(!parent_blueprint.attr){
	  		return [];
	  	}


	  	if(parent_blueprint.attr('leaf')){
	  		return [];
	  	}

	  	if(!parent_blueprint.attr('children')){
	  		return blueprint_list;
	  	}

      var allowed = {};

      var parts = parent_blueprint.attr('children').split(/\W+/);
      parts.forEach(function(part){
        allowed[part] = part;
      })

      return blueprint_list.filter(function(blueprint){
        var name = blueprint.attr('name') || blueprint.attr('tag');
        return allowed[name];
      })
    },
	  // get a container that holds the blueprints that can be added to the given blueprint
	  get_add_children:function(for_blueprint){
	  	ensure_holder();
	  	if(!for_blueprint){
	  		return holder;
	  	}

	  	if(for_blueprint.attr('leaf')){
	  		return null;
	  	}

	  	if(for_blueprint.attr('children')){
	  		return holder.find('[name='+for_blueprint.attr('children')+']');
	  	}
	  	else{
	  		return holder;
	  	}
	  },
	  get_children:function(for_blueprint){
	  	return this.get_add_children(for_blueprint);
	  },
	  get:function(name){
	    if(arguments.length<=0){
	      return blueprints;
	    }
	    return blueprints[name];
	  },
	  get_addbutton_blueprints:function(container){
	  	var self = this;
	  	var currentblueprint = this.for_container(container);
      var blueprints = this.get_children(currentblueprint);

      return blueprints ? blueprints.map(function(b){
      	return self.get(b.attr('name'));
      }) : [];

	  },
	  all_containers:function(visible){
	  	if(!holder){
	  		return [];
	  	}
	  	return holder.containers().filter(function(blueprint){
	  		if(!visible){
	  			return true;
	  		}
	  		return blueprint.attr('visible')!==false;
	  	})
	  },
	  all:function(){
	  	var ret = {};
	  	for(var prop in blueprints){
	  		ret[prop] = blueprints[prop];
	  	}
	  	return ret;
	  },
	  create:function(blueprint){
	  	if(typeof(blueprint)==='string'){
	  		blueprint = this.get(blueprint);
	  	}
			
			if(!blueprint){
				return $digger.create(name, {});
			}
			var data = blueprint ? {
				_digger:{
					leaf:blueprint.attr('leaf'),
					blueprint:blueprint.attr('name'),
					tag:blueprint.attr('tag') || blueprint.attr('name'),
					class:(blueprint.digger('class') || []).filter(function(c){
						return (c || '').match(/\w/);
					}),
					icon:blueprint.attr('icon')
				}
			} : {}

			blueprint.find('field').each(function(field){
				var name = field.attr('name');
				var def = field.attr('default');

				if(def){
					data[name] = def;
				}
			})

			var container = $digger.create([data]);
			container.data('new', true);

			return container;
	  },
	  templates:{},
		add_template:function(name, plate){
			this.templates[name] = plate.replace(/^\s+/, '').replace(/\s+$/);
	    return this;
	  },
	  for_container:function(container){
	  	var type = 'folder';
	  	if(container){
	  		if(container.digger('blueprint')){
		  		type = container.digger('blueprint');
		  	}
		  	else {
		  		type = container.tag();
		  	}
	  	}
	  	return this.get(type);
	  },
	  get_template:function(name){
	    if(arguments.length<=0){
	      return this.templates;
	    }
	    return this.templates[name];
	  }
	}

	var folder = $digger.create('<blueprint name="folder"><field name="name" /></blueprint>');
	api.add(folder);

	return api;
}