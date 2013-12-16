var Blueprints = require('../src');
var SupplyChain = require('digger-supplychain');

describe('digger blueprints', function(){


  it('should load from a warehouse', function(done) {

    var $digger = new SupplyChain();
    $digger.on('request', function(req, res){
      req.headers["x-json-selector"].string.should.equal("blueprint:tree");
      req.url.should.equal('/apples/select');
      res(null, [{
        _digger:{
          tag:'blueprint'
        },
        name:'test'
      }])
    })
    var blueprints = Blueprints($digger);
    blueprints.load('/apples', function(results){
      var test = blueprints.get('test');
      test.count().should.equal(1);
      done();
    })
  })

  it('should allow access to templates', function(done) {
    var $digger = new SupplyChain();
    var blueprints = Blueprints($digger);

    blueprints.add_template('test', '<div></div>');
    blueprints.get_template('test').should.equal('<div></div>');
    done();
  })

  it('should create a container from a blueprint', function(done) {
    var $digger = new SupplyChain();
    var blueprints = Blueprints($digger);

    var print = $digger.create({
      _digger:{
        tag:'blueprint',
        class:['tall', 'central']
      },
      name:'building',
      icon:'building.png'
    })

    var container = blueprints.create(print);

    container.count().should.equal(1);
    container.tag().should.equal('building');
    container.hasClass('tall').should.equal(true);
    container.digger('icon').should.equal('building.png');

    done();
  })

  it('should filter the list of children allowed', function(done) {
    var $digger = new SupplyChain();
    var blueprints = Blueprints($digger);

    var product = $digger.create({
      _digger:{
        tag:'blueprint'
      },
      name:'product',
      children:'review'
    })

    var review = $digger.create({
      _digger:{
        tag:'blueprint'
      },
      name:'review'
    })

    blueprints.add(product);
    blueprints.add(review);

    var children = blueprints.get_add_children(product);
    children.count().should.equal(1);
    children.title().should.equal('review');
    done();
    

  })

  it('should process a blueprints fields into an object array', function(done) {

    var $digger = new SupplyChain();
    var blueprints = Blueprints($digger);

    var print = $digger.create({
      _digger:{
        tag:'blueprint'
      },
      name:'product',
      _children:[{
        _digger:{
          tag:'field'
        },
        type:'text',
        name:'field1'
      },{
        _digger:{
          tag:'field'
        },
        type:'number',
        name:'field2'
      }]
    })

    blueprints.add(print);

    var processed = blueprints.get('product');

    var fields = processed.fields;

    fields.length.should.equal(2);
    fields[0].type.should.equal('text');
    fields[1].name.should.equal('field2');

    done();
  })

})
