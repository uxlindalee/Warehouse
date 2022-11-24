window.warehouseDataGenerator = (function() {

	const shuttlesArray = [];
	const shuttlesMap = {};
	const racksArray = [];
	const racksMap = {};

	const existRacksArray = [[], [], []];
	const blankRacksArray = [];

	let loadedTime = new Date().getTime();

	let presetScenarios = [
		['3-4-R-3', '2-2-L-5'],
		['2-4-L-3', '2-3-R-2'],
		['2-5-R-5', '3-6-L-2']
	];
	let scenario = null;

	function initialize(data) {
		data.shuttle.forEach(function(shuttle) {
			shuttlesArray.push(shuttle);
			shuttlesMap[shuttle.shuttle_id] = shuttle;
		});
		data.warehouse.forEach(function(rack) {
			racksArray.push(rack);
			racksMap[rack.id] = rack;
			if (rack.load_yn === 'Y') {
				existRacksArray[rack.id[0] - 1].push(rack);
			} else {
				blankRacksArray.push(rack);
			}
		});
	}

	function generateScenario() {
		const shuttle = shuttlesArray[0];
		const currentFloorExistRacksArray = existRacksArray[shuttle[(shuttle.shuttle_unload_yn === 'Y' ? 'to' : 'from') + '_product_index'][0] - 1];

		let fromIndex, toIndex;

		if (presetScenarios.length) {
			const preset = presetScenarios.shift();
			fromIndex = getRackIndexById(preset[0], currentFloorExistRacksArray);
			toIndex = getRackIndexById(preset[1], blankRacksArray);
		} else {
			fromIndex = Math.round((currentFloorExistRacksArray.length - 1) * Math.random());
			toIndex = Math.round((blankRacksArray.length - 1) * Math.random());
		}

		const fromRack = currentFloorExistRacksArray[fromIndex];
		const toRack = blankRacksArray[toIndex];

		const fromId = fromRack.id;
		const toId = toRack.id;

		const list = [];
		const boxType = fromRack.box_type;
		const duration = 3000;

		if (fromId[0] === toId[0]) { // same floor
			
			list.push([{shuttle_id: "shuttle_1", from_product_index: fromId, to_product_index: toId,
					shuttle_load_yn: "N", shuttle_unload_yn: "N", elv_boarding_yn: "N", elv_alight_yn: "N", box_type: boxType}, duration]);
			
			list.push([{shuttle_id: "shuttle_1", from_product_index: fromId, to_product_index: toId,
					shuttle_load_yn: "Y", shuttle_unload_yn: "N", elv_boarding_yn: "N", elv_alight_yn: "N", box_type: boxType}, duration]);
			
			list.push([{shuttle_id: "shuttle_1", from_product_index: fromId, to_product_index: toId,
					shuttle_load_yn: "Y", shuttle_unload_yn: "Y", elv_boarding_yn: "N", elv_alight_yn: "N", box_type: boxType}, duration * 0.5]);
		} else {
			
			list.push([{shuttle_id: "shuttle_1", from_product_index: fromId, to_product_index: toId,
					shuttle_load_yn: "N", shuttle_unload_yn: "N", elv_boarding_yn: "N", elv_alight_yn: "N", box_type: boxType}, duration]);
			
			list.push([{shuttle_id: "shuttle_1", from_product_index: fromId, to_product_index: toId,
					shuttle_load_yn: "Y", shuttle_unload_yn: "N", elv_boarding_yn: "N", elv_alight_yn: "N", box_type: boxType}, duration]);
			
			list.push([{shuttle_id: "shuttle_1", from_product_index: fromId, to_product_index: toId,
					shuttle_load_yn: "Y", shuttle_unload_yn: "N", elv_boarding_yn: "Y", elv_alight_yn: "N", box_type: boxType}, duration]);
			
			list.push([{shuttle_id: "shuttle_1", from_product_index: fromId, to_product_index: toId,
					shuttle_load_yn: "Y", shuttle_unload_yn: "N", elv_boarding_yn: "Y", elv_alight_yn: "Y", box_type: boxType}, duration]);
			
			list.push([{shuttle_id: "shuttle_1", from_product_index: fromId, to_product_index: toId,
					shuttle_load_yn: "Y", shuttle_unload_yn: "Y", elv_boarding_yn: "Y", elv_alight_yn: "Y", box_type: boxType}, duration * 0.5]);
		}

		scenario = {
			fromIndex: fromIndex,
			// fromId: fromId,
			// toIndex: toIndex,
			// toId: toId,
			list: list,
			nextChangeAt: new Date().getTime() + list[0][1]
		};

		writeScenario();
	}

	function writeScenario() {
		const currentScenario = scenario.list.shift()[0];
		for (let key in currentScenario) {
			shuttlesArray[0][key] = currentScenario[key];
		}
	}

	function generateData() {
		const time = new Date().getTime();
		if (time >= scenario.nextChangeAt) {
			if (scenario.list.length) {
				scenario.nextChangeAt = time + scenario.list[0][1];
				writeScenario();

				if (!scenario.list.length) {
					const shuttle = shuttlesArray[0];

					existRacksArray[shuttle.from_product_index[0] - 1].splice(scenario.fromIndex, 1);
					existRacksArray[shuttle.to_product_index[0] - 1].push(racksMap[shuttle.to_product_index]);

					blankRacksArray.splice(getRackIndexById(shuttle.to_product_index, blankRacksArray), 1);
					blankRacksArray.push(racksMap[shuttle.from_product_index]);

					racksMap[shuttle.from_product_index].load_yn = 'N';
					racksMap[shuttle.from_product_index].box_type = 'N';
					racksMap[shuttle.to_product_index].load_yn = 'Y';
					racksMap[shuttle.to_product_index].box_type = shuttle.box_type;
				}
			} else {
				generateScenario();
			}
		}
		window.dataCallback({
			shuttle: shuttlesArray,
			warehouse: racksArray
		});
	}

	function getData() {
		if (!scenario) {
			generateScenario();
		}
		setTimeout(generateData, Math.random() * 100 + 10);
	}

	function getRackIndexById(id, racks) {
		for (let i = 0, max = racks.length; i < max; i++) {
			if (id === racks[i].id) {
				return i;
			}
		}
	}

	initialize({
		"shuttle": [{
			"shuttle_id": "shuttle_1",
			"from_product_index": "3-1-L-3",
			"from_product_index_floor": "3",
			"from_product_index_cell": "1",
			"from_product_index_cell_type": "L",
			"from_product_index_order": "3",
			"to_product_index": "1-5-R-1",
			"to_product_index_floor": "1",
			"to_product_index_cell": "5",
			"to_product_index_cell_type": "R",
			"to_product_index_order": "1",
			"from_pos": "",
			"to_pos": "",
			"box_type": "BLUE",
			"in_out": "out",
			"elv_boarding_yn": "Y",
			"elv_alight_yn": "Y",
			"item": "A",
			"item_count": "10",
			"job_insert_time": "",
			"shuttle_status": "run",
			"load_time": "20170302060255",
			"unload_time": "N",
			"shuttle_load_yn": "N",
			"shuttle_unload_yn": "N"
		}],
		"warehouse": [{
			"id": "1-1-L-1",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-1-L-2",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "1-1-L-3",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-1-L-4",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "1-1-L-5",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "1-1-R-1",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-1-R-2",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "1-1-R-3",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-1-R-4",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "1-1-R-5",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-2-L-1",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-2-L-2",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "1-2-L-3",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-2-L-4",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "1-2-L-5",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "1-2-R-1",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "1-2-R-2",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-2-R-3",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-2-R-4",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "1-2-R-5",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "1-3-L-1",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "1-3-L-2",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-3-L-3",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "1-3-L-4",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-3-L-5",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-3-R-1",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "1-3-R-2",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "1-3-R-3",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-3-R-4",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-3-R-5",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-4-L-1",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "1-4-L-2",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-4-L-3",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "1-4-L-4",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-4-L-5",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-4-R-1",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "1-4-R-2",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "1-4-R-3",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "1-4-R-4",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-4-R-5",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-5-L-1",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "1-5-L-2",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "1-5-L-3",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "1-5-L-4",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "1-5-L-5",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-5-R-1",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-5-R-2",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-5-R-3",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "1-5-R-4",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-5-R-5",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "1-6-L-1",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "1-6-L-2",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-6-L-3",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-6-L-4",
			"floor": "1",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-6-R-1",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-6-R-2",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-6-R-3",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "1-6-R-4",
			"floor": "1",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-L-1",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-L-2",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-L-3",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-L-4",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-L-5",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-R-1",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-R-2",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-R-3",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-R-4",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-1-R-5",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-2-L-1",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-2-L-2",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "2-2-L-3",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "2-2-L-4",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "2-2-L-5",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-2-R-1",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "2-2-R-2",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "2-2-R-3",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "2-2-R-4",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "2-2-R-5",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "2-3-L-1",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "2-3-L-2",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-3-L-3",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "2-3-L-4",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "2-3-L-5",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "2-3-R-1",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-3-R-2",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-3-R-3",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-3-R-4",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-3-R-5",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-4-L-1",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-4-L-2",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "2-4-L-3",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "2-4-L-4",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "2-4-L-5",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "2-4-R-1",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "2-4-R-2",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-4-R-3",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-4-R-4",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-4-R-5",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-5-L-1",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-5-L-2",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "2-5-L-3",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-5-L-4",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-5-L-5",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-5-R-1",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "2-5-R-2",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "2-5-R-3",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "2-5-R-4",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "2-5-R-5",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "2-6-L-1",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-6-L-2",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-6-L-3",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "WHITE",
			"load_yn": "Y"
		}, {
			"id": "2-6-L-4",
			"floor": "2",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-6-R-1",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-6-R-2",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-6-R-3",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "2-6-R-4",
			"floor": "2",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-L-1",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-L-2",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-L-3",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-L-4",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-L-5",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-R-1",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-R-2",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-R-3",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-R-4",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-1-R-5",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-2-L-1",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-2-L-2",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-2-L-3",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-2-L-4",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-2-L-5",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-2-R-1",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "3-2-R-2",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "3-2-R-3",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "3-2-R-4",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "3-2-R-5",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "CARTON",
			"load_yn": "Y"
		}, {
			"id": "3-3-L-1",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "3-3-L-2",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "3-3-L-3",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "3-3-L-4",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "3-3-L-5",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLACK",
			"load_yn": "Y"
		}, {
			"id": "3-3-R-1",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-3-R-2",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-3-R-3",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-3-R-4",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-3-R-5",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-4-L-1",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-4-L-2",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-4-L-3",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-4-L-4",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "3-4-L-5",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "3-4-R-1",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "3-4-R-2",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "3-4-R-3",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "3-4-R-4",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "3-4-R-5",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "BLUE",
			"load_yn": "Y"
		}, {
			"id": "3-5-L-1",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "3-5-L-2",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-5-L-3",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-5-L-4",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-5-L-5",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "3-5-R-1",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-5-R-2",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "3-5-R-3",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "3-5-R-4",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "3-5-R-5",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "YELLOW",
			"load_yn": "Y"
		}, {
			"id": "3-6-L-1",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-6-L-2",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-6-L-3",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-6-L-4",
			"floor": "3",
			"dir": "L",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-6-R-1",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-6-R-2",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-6-R-3",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}, {
			"id": "3-6-R-4",
			"floor": "3",
			"dir": "R",
			"store_index": "-",
			"box_type": "N",
			"load_yn": "N"
		}]
	});

	return {getData: getData};

})();