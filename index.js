/* jshint node: true */
'use strict';

var lib = {
  querystring: require('querystring')
};

function Query(name, sql) {
  this.name = name;
  this.queryObject = this.build(sql);
}

Query.prototype.build = function build(sql, start) {
  start = start || 0;
  var query = {
    query: [],
    params: [],
    values: [],
    start: start,
    length: 0
  };

  var i;
  var buffer = '';
  var parens = 0;

  function flush() {
    if (buffer.length) {
      query.query.push(buffer);
      buffer = '';
    }
  }

  function getName(error) {
    var name = '';

    while (i+1 < sql.length && sql[i+1].match(/[a-z]/)) {
      i++;
      name += sql[i];
    }
    if (!name.length) {
      throw new Error(error);
    }
    return name;
  }

  var name;
  for (i=start; i < sql.length; i++) {
    if (sql[i] == '?') {
      flush();

      if (sql[i+1] == '(') {
        i+=2;

        var groupName;
        if (sql[i] == ':') {
          groupName = getName('Parse failed, expected group name after :');
          i+=2;
        }

        var group = build(sql, i);

        if (groupName) {
          group.name = groupName;
        }

        query.query.push(group);
        i += group.length;
      }
      else {
        name = getName('Parse failed, expected parameter name or ( after ?');
        query.query.push({param:name});
        query.params.push(name);
      }
    }
    else if (sql[i] == '$')  {
      flush();

      name = getName('Parse failed, expected value name after $');
      query.query.push({value:name});
      query.values.push(name);
    }
    else {
      if (sql[i] == '(') {
        parens++;
      }
      else if (sql[i] == ')') {
        parens--;
        // If we hit the end-group paranthesis.
        if (parens < 0) {
          break;
        }
      }
      buffer += sql[i];
    }
  }
  flush();

  query.length = i-start;
  return query;
};

Query.prototype.id = function(params, values, groups) {
  return this.name +
    ':' + lib.querystring.stringify(params) +
    ':' + lib.querystring.stringify(values) +
    ':' + lib.querystring.stringify(groups);
};

Query.prototype.query = function (params, values, groups) {
  params = params || {};
  values = values || {};
  groups = groups || {};

  var q = this._query(this.queryObject, params, values, groups, false);
  q.id = this.id(params, values, groups);
  return q;
};

Query.prototype._query = function (definition, params, values, groups, child) {
  if (child && definition.name) {
    if (groups[definition.name] !== true && !definition.params.length) {
      return;
    }
    else if (groups[definition.name] === false) {
      return;
    }
  }

  // Check for missing parameters
  for (var pi = 0; pi < definition.params.length; pi++) {
    if (params[definition.params[pi]] === undefined) {
      if (!child || groups[definition.name] === true) {
        throw new Error('Missing parameter "' + definition.params[pi] + '"');
      }
      return;
    }
  }

  // Check for missing values
  for (var vi = 0; vi < definition.values.length; vi++) {
    if (values[definition.values[vi]] === undefined) {
      throw new Error('Missing value "' + definition.values[vi] + '"');
    }
  }

  var q = {
    sql: "",
    params: []
  };
  for (var i = 0; i < definition.query.length; i++) {
    var item = definition.query[i];

    if (typeof item == 'string') {
      q.sql += item;
    }
    else if (item.param) {
      q.sql += '?';
      q.params.push(params[item.param]);
    }
    else if (item.value) {
      q.sql += values[item.value];
    }
    else {
      var group = this._query(item, params, values, groups, true);
      if (group) {
        q.sql += group.sql;
        q.params = q.params.concat(group.params);
      }
    }
  }

  return q;
};

exports.Query = Query;