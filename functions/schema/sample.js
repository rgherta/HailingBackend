const djv = require('djv');

const env = new djv();

const jsonSchema = {
      "properties": {
        "prop1":  { "type": "string" },
        "prop2":  { "type": "number" }
      },
      "required": [
        "prop2"
      ]
  };


  env.addSchema('sch1', jsonSchema);

  function validates(object, schema){
    return !env.validate(schema, object);
  }




  let obj = { 
      prop1 : 'asdsads',
      prop2: 66
   }

  

   console.log( validates(obj, 'sch1') );