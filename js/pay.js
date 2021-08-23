$(document).ready(function() {
	function changePayType(type) {
		var money = 0;
		switch (type) {
		case 3:
		case 1:
		case 4:
			money = 100;
			break;
		case 5:
		case 2:
			money = 200;
			break;

		}
		$("#totalMoney").text(money);
	}

	var eltPayResult = document.getElementById('payResultModal');
	var payResultModal = new bootstrap.Modal(eltPayResult,{
		backdrop: 'static',
		keyboard: false
	});
	var lastQueryIndex = 1;
	var lastOrderId;
	eltPayResult.addEventListener('hide.bs.modal', function(event) {
		lastQueryIndex++;
	});

	var lastPayType = 1;

	function refreshPoint() {
		try {
			var app = window.app;
			if (!app)
				return;
			var ret = app.remoteCall(1002, '');
			if (!ret)
				return;
			var retObj = JSON.parse(ret);
			if (!(retObj.result > 0))
				return;
			if (retObj.point > 0)
				$('#totalPoint').text(retObj.point);
			switch (retObj.accountType) {
			case 1:
				{
					$("#divPayType2").show();
					$("#divPayType3").show();
					$("#divPayType4").hide();
					$("#divPayType5").hide();
				}
				break;
			case 2:
				{
					$("#divPayType2").show();
					$("#divPayType3").hide();
					$("#divPayType4").hide();
					$("#divPayType5").hide();
				}
				break;
			case 0:
			default:
				{
					$("#divPayType2").hide();
					$("#divPayType3").hide();
					$("#divPayType4").show();
					$("#divPayType5").show();
				}
				break;
			}
			//alert(ret);
		} catch (error) {}
		$("#loading-layer").hide();
	}

	refreshPoint();

	function queryOrderState(queryIndex) {
		if (queryIndex != lastQueryIndex)
			return;
		var app = window.app;
		if (!app)
			return;
		var ret = app.remoteCall(1003, '' + lastOrderId);
		if (!ret || ret.length <= 0) {
			$("#od_orderState").text("订单异常");
			return;
		}
		var retObj = JSON.parse(ret);
		if (!(retObj.result > 0)) {
			if (retObj.result != -1)
				$("#od_orderState").text("订单异常");
			return;
		}
		if (retObj.state === 1)
			$("#od_orderState").text("处理中");
		else if (retObj.state === 2) {
			$("#od_orderState").removeClass(["text-danger", "text-success", "text-secondary"]);
			$("#od_orderState").addClass("text-success");
			$("#od_orderState").text("已支付");
			$("#payOkay").removeClass(["btn-secondary", "btn-primary", "btn-success"]);
			$("#payOkay").addClass("btn-success");
			$("#payOkay").text("确定");
			refreshPoint();
			return;
		} else if (retObj.state === 4) {
			$("#od_orderState").removeClass(["text-danger", "text-success", "text-secondary"]);
			$("#od_orderState").addClass("text-success");
			$("#od_orderState").text("已完成");
			$("#payOkay").removeClass(["btn-secondary", "btn-primary", "btn-success"]);
			$("#payOkay").addClass("btn-success");
			$("#payOkay").text("确定");
			refreshPoint();
			return;
		} else if (retObj.state === 3) {
			$("#od_orderState").removeClass(["text-danger", "text-success", "text-secondary"]);
			$("#od_orderState").addClass("text-secondary");
			$("#od_orderState").text("支付失败");
			$("#payOkay").removeClass(["btn-secondary", "btn-primary", "btn-success"]);
			$("#payOkay").addClass("btn-primary");
			$("#payOkay").text("确定");
			return;
		}
		setTimeout(queryOrderState, 3000, queryIndex);
	}
	function startQueryOrderState(orderId) {
		lastQueryIndex++;
		setTimeout(queryOrderState, 5000, lastQueryIndex);
	}

	$('#payType .btn-pay-block').on('click', function() {
		$('#payType .btn-pay-block').removeClass('active');
		$(this).addClass('active');
		var type = parseInt($(this).data('type'));
		changePayType(type);
		lastPayType = type;
	});


	function doPay(payMethodId, payType) {
		//alert(lastPayMethod + '' + lastPayType);
		var payRet = app.remoteCall(1001, payMethodId + '|' + payType);
		if (!payRet) {
			layer.msg('调起支付失败，请联系客服进行购买，或稍后再试。');
			return;
		}

		//alert(payRet);
		var retObj = JSON.parse(payRet);
		if (!(retObj.result > 0) || !retObj.payURL) {
			layer.msg('调起支付失败，请联系客服进行购买，或稍后再试。');
			return;
		}
		$("#od_orderId").text(retObj.orderId);
		$("#od_orderState").removeClass(["text-danger", "text-success", "text-secondary"]);
		$("#od_orderState").addClass("text-danger");
		$("#od_orderState").text("未支付（如已支付，请等待订单自动刷新）");
		$("#payOkay").removeClass(["btn-secondary", "btn-primary", "btn-success"]);
		$("#payOkay").addClass("btn-secondary");
		$("#payOkay").text("取消订单");
		payResultModal.show();
		window.app.OpenURL(retObj.payURL);
		lastOrderId = retObj.orderId;
		startQueryOrderState(retObj.orderId);
	}

    function doPayBtn(payMethodId,payMethodType) {
		var lidx = layer.load(1, {
			shade: [0.5, '#000000'],
			time: 5 * 1000
		});
		setTimeout(function() {
			try {
				var app = window.app;
				if (!app) {
					layer.close(lidx);
					layer.msg('不支持该操作');
					return;
				}

				if (lastPayType === 3 && payMethodType === "code") {
					layer.prompt({
						title: '请输入超级会员激活码',
						offset: 't',
						btn: ['升级', '取消']
					}, function(value, index, elem) {
						if (value.length < 5) {
							layer.msg("请输入正确的超级会员激活码");
							return;
						}
						var ret = app.SetUpgradeCode(value);
						if (ret === 8) {
							layer.msg("超级会员激活成功。");
							refreshPoint();
						} else {
							layer.msg('超级会员激活码错误。');
						}
					});

				} else {
					doPay(payMethodId, lastPayType);
				}
			} catch (error) {
			}
			layer.close(lidx);
		}, 100);

	}

	function tryActiveGame() {
		var app = window.app;
		if (!app) {
			layer.msg('不支持该操作');
			return;
		}
		var ret = app.remoteCall(1004, '');
		if (!ret) {
			layer.msg('开通会员失败，请尝试手动开通或联系客服咨询');
			return;
		}
		var retObj = JSON.parse(ret);
		if (!(retObj.result > 0)) {
			layer.msg('开通会员失败，请尝试手动开通或联系客服咨询');
			return;
		}
		switch (retObj.result) {
		case 1:
			{
				var activeRet = app.setActiveCode(retObj.code);
				if (activeRet < 0) {
					layer.msg("开通会员失败活失败，请稍后重试或联系客服");
					break;
				}
				var cf2 = layer.confirm('开通会员成功，是否继续升级为超级会员？', {
					title: "提示",
					btn: ['升级', '取消']//按钮
				}, function() {
					layer.close(cf2);
					payNow(3);
				}, function() {});
			}
			break;
		case 2:
			{
				layer.msg('该设备已开通会员，无需再次开通');
			}
			break;
		case 3:
			{
				var cf1 = layer.confirm('当前剩余点数不足，是否进行点数充值？', {
					title: "提示",
					btn: ['充值', '取消']//按钮
				}, function() {
					layer.close(cf1);
					payNow(1);
				}, function() {});
			}
			break;
		case 4:
			layer.msg('开通会员失败，如有疑问，请联系客服');
			break;
		}

	}

	function payNow(payType) {
		var app = window.app;
		if (!app) {
			layer.msg('不支持该操作');
			return;
		}
		var payTypes = app.remoteCall(1000, '' + payType);
		var retObj = JSON.parse(payTypes);
		if (!retObj || retObj.result < 0) {
			layer.msg('目前没有可用的支付方式，请联系客服进行购买。');
			return;
		}
		if (retObj.result === 0) {
			layer.msg(retObj.msg);
			return;
		}
		//alert(payTypes);
		switch (retObj.result) {
		case 1:
			{
				var content = '<div class="row justify-content-center"><h6 class="text-primary">本产品采用第三方话费充值方式，请放心支付！由于各地区网速不同，支付页面可能无法打开或打开较慢（部份地区需等待几十秒左右），<span class="text-success">如果无法打开支付页面，请切换不同的支付线路多次尝试！</span><span class="text-success">由于产品的特殊性质，导致在付款时可能会有风险提示，本产品保证没有任何欺诈情况,请放心付款！如遇支付失败，请联系人工客服（<a href="javascript:openChat();">点击这里与客服聊天</a>）进行人工充值或售后服务！</span></h6></div>';
				content += '<table><tbody><tr><td><span>请选择支付方式：</span></td><td><select id="payMethod" class="form-select">';

				if (retObj.methods) {
					var actived = false;
					var index = 0;
					for (var itr in retObj.methods) {
						var method = retObj.methods[itr];
						if (method.type) {
							var se = '';
							if (index == 0) {
								se = 'selected';
							}
							index++;
							content += '<option value="' + method.id + '" data-type="' + method.type + '" ' + se + '>' + method.name + '</option>';
						}
					}
				}
				content += '</select></td><td><span style="text-danger;padding-left:15px">如支付失败，请换条线路并多尝试几次</td></tbody></table>';

				var cfid = layer.confirm(content,{
					title: "请选择充值方式",
					offset: 't',
					btn: ["支付"]
				}, function() {
				    layer.close(cfid);
					var item = $('#payMethod').children("option:selected");
					var payMethodId = parseInt(item.val());
				    var payType = item.data('type');
					doPayBtn(payMethodId,payType);
				});
			}
			break;
		case 2:
			{
				//询问框
				var layerBox = layer.confirm('当前开通普通会员，无法升级，</br>是否花费<span class="text-primary">10</span>个游戏点数开通普通会员？', {
					title: "提示",
					btn: ['开通', '取消']//按钮
				}, function() {
					layer.close(layerBox);
					tryActiveGame();
				}, function() {
					$("#payBtn1").click();
				});
			}
			break;
		case 3:
			{
				layer.msg("您已是超级会员，无需再次开通");
			}
			break;
		}
	}

	$('#payNow').click(function() {
		$(this).attr('disabled', '');
		var lidx = layer.load(1, {
			shade: [0.5, '#000000'],
			time: 5 * 1000
		});
		setTimeout(function() {
			payNow(lastPayType);
			$('#payNow').removeAttr('disabled');
			layer.close(lidx);
		}, 100);

	});
	var urlParams = new URLSearchParams(extParams);
	var buyType = urlParams.get('buyType');
	if (typeof (buyType) === 'string')
		lastPayType = parseInt(buyType);
	$("#payBtn" + lastPayType).click();
});
