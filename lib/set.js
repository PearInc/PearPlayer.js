/**
 * Created by snow on 17-6-22.
 */

module.exports = Set;

function Set() {
    this.items = {};
}

Set.prototype = {
    constructer: Set,
    has: function(value) {
        return value in this.items;
    },
    add: function(value) {
        if (!this.has(value)) {
            this.items[value] = value;
            return true;
        }
        return false;
    },
    remove: function(value) {
        if (this.has(value)) {
            delete this.items[value];
            return true;
        }
        return false;
    },
    clear: function() {
        this.items = {};
    },
    size: function() {
        return Object.keys(this.items).length;
    },
    values: function() {
        return Object.keys(this.items); //values是数组
    },
    union: function(otherSet) {
        var unionSet = new Set();
        var values = this.values();
        for (var i = 0; i < values.length; i++) {
            unionSet.add(values[i]);
        }
        values = otherSet.values();
        for (var i = 0; i < values.length; i++) {
            unionSet.add(values[i]);
        }
        return unionSet;
    },
    intersection: function(otherSet) {
        var intersectionSet = new Set();
        var values = this.values();
        for (var i = 0; i < values.length; i++) {
            if (otherSet.has(values[i])) {
                intersectionSet.add(values[i]);
            }
        }
        return intersectionSet;
    },
    difference: function(otherSet) {
        var differenceSet = new Set();
        var values = otherSet.values();
        for (var i = 0; i < values.length; i++) {
            if (!this.has(values[i])) {
                differenceSet.add(values[i]);
            }
        }
        return differenceSet;
    },
    subset: function(otherSet) {
        if (this.size() > otherSet.size()) {
            return false;
        } else {
            var values = this.values();
            for (var i = 0; i < values.length; i++) {
                if (!otherSet.has(values[i])) {
                    return false;
                }
            }
        }
        return true;
    }
}
