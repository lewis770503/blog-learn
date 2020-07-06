const convertPagination = function(resource, currentPage){
    const totalResult = resource.length;
    const perpage = 5; //每一頁幾筆
    const pageTotal = Math.ceil(totalResult / perpage); //總共頁數
    if(currentPage > pageTotal){
      currentPage = pageTotal;
    }
    const minItem = (currentPage * perpage) - perpage + 1;
    const maxItem = currentPage * perpage;
    const pageData = [];
    resource.forEach(function(item,i){
      let itemNum = i + 1;
      if(itemNum >= minItem && itemNum <= maxItem){
        pageData.push(item);
      }
    });
    const page = {
      pageTotal,
      currentPage,
      hasPrev: currentPage > 1,
      hasNext: currentPage < pageTotal
    }
    return{
        page,
        pageData
    }
}
module.exports = convertPagination;