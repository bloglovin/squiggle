var lib = {
  squiggle: require('../')
};

var q = new lib.squiggle.Query('test',
  "SELECT * FROM TABLE foobar " +
  "WHERE id=?id ?(AND public=?public )" +
  "?(:named AND arbitrary=42 )" +
  "LIMIT $offset, $limit");

var examples = [
  {
    params: {id:12},
    values: {offset:0, limit:20}
  },
  {
    params: {id:2},
    values: {offset:0, limit:20},
    groups: {named:true}
  },
  {
    params: {id:5, public:true},
    values: {offset:0, limit:10}
  }
];

examples.forEach(function(spec, idx) {
  console.log('var id%d = %j;', idx, q.id(spec));
  console.dir(q.query(spec));
  console.log('');
});
