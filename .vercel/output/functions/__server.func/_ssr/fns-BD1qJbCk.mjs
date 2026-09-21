import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-BP8X2JkE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fns-BD1qJbCk.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getAccessState = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c78d5709ee3f3fcde071f5c61d8d16b5f25632fa3d563b336861f028355b85cf"));
var getSetupState = createServerFn({ method: "GET" }).handler(createSsrRpc("48295fd14f53bc904ac6f548ce1e295c621626c4abd1e8be4d8ddc4c54a979cc"));
var listMonitorsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("d15db79600b737d5999be3bdabc326615427bf0ab29a1183e310c9e3713631e4"));
var getMonitorFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("36b09dc8a8ec4db694d6eb117ae139161de03822e209e592386125a3fbae8d56"));
var saveMonitorFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("eaaad62e75e9deae945e18954e5cb1858ee2e6ac24c19fbe5db746617061a508"));
var deleteMonitorFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("7e948dc47ab561ba6d3c2a3f3114fd056aa50aa3188dc0284bbd404768b55ce6"));
var setMonitorActiveFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("bd4f0198f746340bf4ced015bafa110c414ff15a0ac8e6d09c2fcf10060b35bc"));
var setMonitorChannelsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("be009867ef532a1ff39fa0954f840183bf8aace6a3df77668d34196129b7df4c"));
var getMonitorChannelsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((monitorId) => monitorId).handler(createSsrRpc("ea7884b6a2d21f1497d28f3b34f023f9f154425ef641ecca135e1db5e371b965"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("11987372b041eba42a0d24b8925759b57e0ae9e963873d2552f6d166ffa1bd53"));
var listMembersFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c030d4763f3b4fcf9f053ca7ac4d7b1a090b9d10ea28b08a11845b83c175cdf4"));
var addMemberFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("f5a7b38416c318cbe55634fe7a8b54510deed56d19c6abc51ec7e4f297e26116"));
var setMemberRoleFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("858c09afce6aeffdc380dc3fb39ffe643eb10b69e4993570bdbaacfd1cab59fe"));
var removeMemberFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((userId) => userId).handler(createSsrRpc("fa5de8a68051db0411fb59352271621c4f278a5fad540e33200debee298bf720"));
var setMemberPasswordFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("4c53760817e114c68fc07cf9faa693cc8ab4a23bb56c7a8369670a23425b351a"));
var listChannelsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("94fbc39e4956a5e00bc295db0f37146ec29a4d37137d5bdb77bc604158247b92"));
var saveChannelFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("12f0549b6d2962f2d0c5c85c6c874b90a6e5d974080fff553387b30ed4d57f99"));
var deleteChannelFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("81fe819350b3a0b354698aa2de1c64ac6b25420685edf3a254b520716f9ecf9e"));
var testChannelFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("f6346fcdd0904ec51d4307ee71eae39572c422db2c464ce896663754f8303cab"));
var listNotifyLogFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("fbe2f2b8b14c616ad1d434660dcc937304b93549730a5a83fbc19c183482e299"));
var listPagesFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("7c85398431f4341d2c32e789df88caf07230a6a933e89c3957352c7c50bd465a"));
var savePageFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("5c4d71fd8c8e0e52616a7f30a2651c63da223858cd53e7d189dc40f0271b4627"));
var deletePageFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("16b49434f10f1ada0b5e164e89bf502c9d529fbcf625dbe5af0ccebd1de1f63c"));
var getPublicStatusFn = createServerFn({ method: "GET" }).validator((slug) => slug).handler(createSsrRpc("4c235f2012ed73055deb4125cb0612e70274b2d725da5af9a4825a8f262dee65"));
var getSiteNameFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("3b485a327660a6c429e32cf2e67c79241c97aa8d3d5be4b4c67a3c000102ee90"));
var setSiteNameFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((siteName) => siteName).handler(createSsrRpc("4604c491db08a645d39132bc6b1cc47759794203665c27c4095e1f2727fb14ad"));
var exportBackupFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1ab43da2a64ecf8c980242a6d6a5fae75ada850e1ab4dc126e88848742168c72"));
var restoreBackupFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("bf048ebca05917ea8802c6b8501bd0c76a993c7a02e2f3cc14f51246d783be8d"));
//#endregion
export { setMemberPasswordFn as C, setSiteNameFn as D, setMonitorChannelsFn as E, testChannelFn as O, savePageFn as S, setMonitorActiveFn as T, listPagesFn as _, deletePageFn as a, saveChannelFn as b, getMonitorChannelsFn as c, getSetupState as d, getSiteNameFn as f, listNotifyLogFn as g, listMonitorsFn as h, deleteMonitorFn as i, getMonitorFn as l, listMembersFn as m, createSsrRpc as n, exportBackupFn as o, listChannelsFn as p, deleteChannelFn as r, getAccessState as s, addMemberFn as t, getPublicStatusFn as u, removeMemberFn as v, setMemberRoleFn as w, saveMonitorFn as x, restoreBackupFn as y };
