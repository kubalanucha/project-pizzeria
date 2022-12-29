import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from '../components/amountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
    thisProduct.prepareCartProduct();
    thisProduct.prepareCartProductParams();
  }

  renderInMenu(){
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /* create element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);

  }

  getElements(){
    const thisProduct = this;

    thisProduct.dom = {};
    
    thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.dom.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);

  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.dom.amountWidget  = new AmountWidget(thisProduct.dom.amountWidgetElem);
      
    thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
    
  }

  initAccordion(){
    const thisProduct = this;

    /* START: add event listener to clickable trigger on event click */
    thisProduct.dom.accordionTrigger.addEventListener('click', function(event){
        
      /* prevent default action for event */
      event.preventDefault();

      /* find active product (product that has active class) */
      const active = document.querySelector(select.all.menuProductsActive);
        
      /* if there is active product and it's not thisProduct.element, remove class active from it */
      if(active && active != thisProduct.dom.accordionTrigger){
        active.classList.remove(classNames.menuProduct.wrapperActive);
      }

      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
        
    }); 
  
  }

  initOrderForm(){
    const thisProduct = this;

    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });

  }

  processOrder() {
    const thisProduct = this;
    
    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    
    // set price to default price
    let price = thisProduct.data.price;
    
    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
    
      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
          
        // check if there is param with a name of paramId in formData and if it includes optionId
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if(optionSelected) {
          // check if the option is not default
          if(option !== option.default) {
            let optionPrice = option.price;

            price = price + optionPrice;

          }
        } else {
          // check if the option is default 
          if(option === option.default) {
            let optionPrice = option.price;
            price = price - optionPrice;
          } 
        }

        // Code for adding images
        const optionImage = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        if(optionImage){ // if image exists
          if(optionSelected){ // if image is selected
            optionImage.classList.add(classNames.menuProduct.imageVisible); // then add active class
          } else { // if not
            optionImage.classList.remove(classNames.menuProduct.imageVisible); // remove
          }
        }
      }
    }
    
    thisProduct.priceSingle = price; 

    // update calculated price in the HTML
    price *= thisProduct.dom.amountWidget.value;
    thisProduct.dom.priceElem.innerHTML = price;
  }

  addToCart(){
    const thisProduct = this;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event); 
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {

      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.dom.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.dom.amountWidget.value * thisProduct.priceSingle,
      params: thisProduct.prepareCartProductParams(),

    };

    return productSummary;

  }

  prepareCartProductParams(){
    const thisProduct = this;
    
    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};
    
    // for every category (param)
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
    
      // create category param in params
      params[paramId] = {
        label: param.label,
        options: {}
      };

      // for every option in this category
      for(let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if(optionSelected) {
          // option is selected!
          params[paramId].options[paramId] = option.label;
        }
      }
    }  

    return params;

  }

}

export default Product;