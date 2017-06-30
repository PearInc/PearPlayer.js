var test = require("tape"),
    BitField = require("./");

var data = "011011100110111".split("").map(Number).map(Boolean),
    field = new BitField(data.length);

test("bitfield should be empty when initialized", function(t){
	for(var i = 0; i < data.length; i++){
		t.strictEqual(field.get(i), false);
	}

	t.end();
});

//Write data

test("should reproduce written data", function(t){
	for(var i = 0; i < data.length; i++){
		field.set(i, data[i]);
	}

	for(var i = 0; i < data.length; i++){
		t.strictEqual(field.get(i), data[i]);
	}

	t.end();
});


test("out-of-bounds should simply be false", function(t){
	for(var i = data.length; i < 1e3; i++){
		t.strictEqual(field.get(i), false);
	}

	t.end();
});

test("should not grow by default", function(t){
	var index = 25;

	for(var i = 0; i < 100; i++) {
		index += 8 + Math.floor(32 * Math.random());

		var oldLength = field.buffer.length;
		t.strictEqual(field.get(index), false);
		t.equal(field.buffer.length, oldLength, "should not have grown for get()");
		field.set(index, true);

		t.equal(field.buffer.length, oldLength, "should not have grown for set()");
		t.strictEqual(field.get(index), false);
	}

	t.end();
});

test("should be able to grow to infinity", function(t){
	var growField = new BitField(data.length, { grow: Infinity }),
	    index = 25;

	for(var i = 0; i < 100; i++) {
		index += 8 + Math.floor(32 * Math.random());

		var oldLength = growField.buffer.length;
		t.strictEqual(growField.get(index), false);
		t.equal(growField.buffer.length, oldLength, "should not have grown for get()");
		growField.set(index, true);
		var newLength = Math.ceil((index + 1) / 8);
		t.ok(growField.buffer.length >= newLength, "should have grown for set()");
		t.strictEqual(growField.get(index), true);
	}

	t.end();
});

test("should restrict growth to growth option", function(t){
	var smallGrowField = new BitField(0, { grow: 50 });

	for(var i = 0; i < 100; i++) {
		var oldLength = smallGrowField.buffer.length;
		smallGrowField.set(i, true);
		if (i <= 55) {
			t.ok(smallGrowField.buffer.length >= (i >> 3) + 1, "should have grown for set()");
			t.strictEqual(smallGrowField.get(i), true);
		} else {
			t.equal(smallGrowField.buffer.length, oldLength, "should not have grown for set()");
			t.strictEqual(smallGrowField.get(i), false, i + " bitfield " + smallGrowField.buffer.length);
		}
	}

	t.end();
});

test("if no data or size passed in, should assume size 0", function(t){
	var field2 = new BitField();
	t.ok(field2.buffer);

	t.end();
});

test("correct size bitfield", function(t){
  t.equal(new BitField(1).buffer.length, 1);
  t.equal(new BitField(2).buffer.length, 1);
  t.equal(new BitField(3).buffer.length, 1);
  t.equal(new BitField(4).buffer.length, 1);
  t.equal(new BitField(5).buffer.length, 1);
  t.equal(new BitField(6).buffer.length, 1);
  t.equal(new BitField(7).buffer.length, 1);
  t.equal(new BitField(8).buffer.length, 1);
  t.equal(new BitField(9).buffer.length, 2);
  t.equal(new BitField(10).buffer.length, 2);
  t.equal(new BitField(11).buffer.length, 2);
  t.equal(new BitField(12).buffer.length, 2);
  t.equal(new BitField(13).buffer.length, 2);
  t.equal(new BitField(14).buffer.length, 2);
  t.equal(new BitField(15).buffer.length, 2);
  t.equal(new BitField(16).buffer.length, 2);
  t.equal(new BitField(17).buffer.length, 3);
  t.end();
});
