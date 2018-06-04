export default (function(){
    const store = {};

    return {
        getALL() {
            return store;
        },

        hasKey(key) {
            return store[key] ? true : false;
        },

        appendDataInKey(key, data) {
            store[key].push(data);
        },

        createKey(key) {
            store[key] = [];
        },

        getDataByKey(key) {
            return store[key];
        }
    }
})();