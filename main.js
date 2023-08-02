"use strict";

$(document).on("click", ".btn-primary", function (e) {
  e.preventDefault();

  const targetId = $(this).data("target");
  const cardId = targetId.split("#collapseExample-")[1];
  const cardContentElement = document.getElementById("card-content-" + cardId);
  let cardNameId = cardContentElement.getAttribute("data-my-info");

  const isCollapsed = $(targetId).hasClass("show");

  if (isCollapsed) {
    $(targetId).collapse("toggle");
    return;
  }

  // Check if the data is in session storage and hasn't expired
  const storedData = sessionStorage.getItem(`coin_${cardNameId}`);
  const currentTime = Date.now();
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    if (parsedData.timestamp + 120000 > currentTime) {
      // TTL is 2 minutes (2 * 60 * 1000 = 120000 milliseconds)
      displayCoinData(parsedData.data, cardId, targetId);
      return;
    }
  }

  $.ajax({
    url: `https://api.coingecko.com/api/v3/coins/${cardNameId}`,
    type: "GET",
    dataType: "json",
    success: function (data) {
      // Save fetched data to session storage
      const dataToStore = {
        data: data,
        timestamp: currentTime,
      };
      sessionStorage.setItem(`coin_${cardNameId}`, JSON.stringify(dataToStore));

      displayCoinData(data, cardId, targetId);
    },
  });
});

(() => {
  const currenciesLink = document.getElementById("currenciesLink");
  const homeLink = document.getElementById("homeLink");
  const reportsLink = document.getElementById("reportsLink");
  const aboutLink = document.getElementById("aboutLink");
  const mainContent = document.getElementById("mainContent");
  const modalMainContent = document.getElementById("modalMainContent");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");

  let currentCoinsList = [];
  let checkedCards = [];
  let currentCoinSelected = null;

  currenciesLink.addEventListener("click", displayCurrencies);
  reportsLink.addEventListener("click", displayReports);
  aboutLink.addEventListener("click", displayAbout);
  homeLink.addEventListener("click", () => {
    hideSearchSection();
    mainContent.innerHTML = "";
  });

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (searchInput.value !== "" && currentCoinsList.length !== 0) {
      const filteredList = currentCoinsList.filter(
        (coin) =>
          coin.name.toUpperCase().includes(searchInput.value.toUpperCase()) ||
          coin.symbol.toUpperCase().includes(searchInput.value.toUpperCase())
      );
      if (filteredList.length > 0) {
        drawCoinsCard(filteredList);
      } else {
        drawMainMessage(mainContent, "Empty list, try search again!");
      }
    } else {
      drawCoinsCard(currentCoinsList);
    }
  });

  function drawMiniCard(coinsList) {
    modalMainContent.innerHTML = "";
    const columnNumber = 4;
    for (let rowIndex = 0; rowIndex < coinsList.length; rowIndex++) {
      const newRow = document.createElement("div");
      newRow.className = "row";

      for (let colIndex = 0; colIndex < columnNumber; colIndex++) {
        const newColumn = document.createElement("div");
        newColumn.className = "col";

        
        const newElement = document.createElement("div");
        const index = rowIndex * columnNumber + colIndex;
        if (!coinsList[index]) continue;
        newElement.innerHTML = createNewMiniCard(
          index,
          coinsList[index].symbol.toUpperCase(),
          coinsList[index].name,
          coinsList[index].id
        );
        newColumn.appendChild(newElement);

        newRow.appendChild(newColumn);
      }
      modalMainContent.appendChild(newRow);
    }
  }

  function drawCoinsCard(coinsList) {
    mainContent.innerHTML = "";
    const columnNumber = 4;
    for (let rowIndex = 0; rowIndex < coinsList.length; rowIndex++) {
      const newRow = document.createElement("div");
      newRow.className = "row";

      for (let colIndex = 0; colIndex < columnNumber; colIndex++) {
        const newColumn = document.createElement("div");
        newColumn.className = "col";

        
        const newElement = document.createElement("div");
        const index = rowIndex * columnNumber + colIndex;
        if (!coinsList[index]) continue;
        newElement.innerHTML = createNewCard(
          index,
          coinsList[index].symbol.toUpperCase(),
          coinsList[index].name,
          coinsList[index].id,
          coinsList[index].image
        );
        newColumn.appendChild(newElement);

        newRow.appendChild(newColumn);
      }
      mainContent.appendChild(newRow);
    }

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const index = checkbox.id.split("-").pop();
        const isChecked = checkbox.checked;
        console.log(
          `Checkbox ${index} is ${isChecked ? "checked" : "unchecked"}.`
        );

        const cardContent = document.getElementById(`card-content-${index}`);
        const coin = currentCoinsList.find(
          (coin) => coin.name === cardContent.innerText.trim()
        );
        if (isChecked) {
          coin["index"] = index;
          if (checkedCards.length === 5) {
            drawMiniCard(checkedCards);
            openModal();
            currentCoinSelected = {
              checkbox,
              coin,
            };

            checkbox.checked = false;
            return;
          }
          checkedCards.push(coin);
        } else {
          const indexToRemove = checkedCards.findIndex(
            (coin) => coin.name === cardContent.innerText.trim()
          );
          if (indexToRemove !== -1) {
            checkedCards.splice(indexToRemove, 1);
          }
        }
      });
    });
  }

  function openModal() {
    const modal = document.getElementById("myModal");

    $(modal).modal("show");

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        const index = checkbox.id.split("-").pop();
        const isChecked = checkbox.checked;
        console.log(
          `Checkbox ${index} is ${isChecked ? "checked" : "unchecked"}.`
        );

        const cardContent = document.getElementById(
          `mini-card-content-${index}`
        );
        const coin = checkedCards.find(
          (coin) => coin.name === cardContent.innerText.trim()
        );
        if (coin) {
          const cardCheckbox = document.getElementById(
            `card-select-${coin.index}`
          );
          cardCheckbox.checked = false;
        }

        if (isChecked) {
          const indexToRemove = checkedCards.findIndex(
            (coin) => coin.name === cardContent.innerText.trim()
          );
          if (indexToRemove !== -1) {
            checkedCards.splice(indexToRemove, 1);
          }

          if (currentCoinSelected) {
            currentCoinSelected.checkbox.checked = true;
            checkedCards.push(currentCoinSelected.coin);
          }
          currentCoinSelected = null;
          $(modal).modal("hide");
        }
      });
    });
  }

  function displayCurrencies() {
    showSearchSection();
    $.ajax({
      url: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1",
      type: "GET",
      dataType: "json",
      success: function (data) {
        currentCoinsList = data;
        drawCoinsCard(currentCoinsList);
      },
    });
  }

  function displayReports() {
    hideSearchSection();
    drawMainMessage(mainContent, "Working Here ! Coming Soon !");
  }

  function createNewCard(index, title, content, coinId, img) {
    const card = `
    <div class="card" style="width: 18rem; margin: 0.5rem">
        <div class="card-body">
            <h5 id="card-title-${index}" class="card-title">${title}</h5>
            <p data-my-info=${coinId} id="card-content-${index}" class="card-text">${content}
              <img src="${img}" style="width:20%"> </img>
            </p>
            <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#collapseExample-${index}" aria-expanded="false" aria-controls="collapseExample-${index}">
              More Info
            </button>
            <label class="switch">
              <input id="card-select-${index}" type="checkbox">
              <span class="slider round"></span>
            </label>
            <div class="collapse" id="collapseExample-${index}">
                <div id="collapse-content-${index}" class="card card-body">
                    
                </div>
            </div>
        </div>
    </div>`;
    return card;
  }

  function createNewMiniCard(index, title, content, coinId) {
    const card = `
    <div class="card" style="width: 18rem; margin: 0.5rem">
        <div class="card-body">
            <h5 id="mini-card-title-${index}" class="card-title">${title}</h5>
            <p data-my-info=${coinId} id="mini-card-content-${index}" class="card-text">${content}
            </p>
            <label class="switch">
              <input id="mini-card-select-${index}" type="checkbox">
              <span class="slider round"></span>
            </label>
        </div>
    </div>`;
    return card;
  }

  function createSection(sectionTitle, sectionContent) {
    const section = document.createElement("section");
    section.classList.add("content-section");

    const sectionTitleElement = document.createElement("h2");
    sectionTitleElement.textContent = sectionTitle;
    section.appendChild(sectionTitleElement);

    const sectionContentElement = document.createElement("p");
    sectionContentElement.textContent = sectionContent;
    section.appendChild(sectionContentElement);

    return section;
  }

  function createAboutUsSection() {
    const aboutUsSection = createSection(
      "About Us",
      "My name is Kfir Aroyo, and last year I decided to do professional training in the field of software development. For this purpose, I started a software development course at the excellent John Bryce College, and as part of the course I developed a website that displays the exchange rates of the most popular virtual currencies in the world compared to the Shekel, the Dollar and the Euro, called “Virtual Currencies World”."
    );

    const imagesContainer = document.createElement("div");
    imagesContainer.classList.add("images-container");

    const myImage = document.createElement("img");
    myImage.setAttribute("src", "kfirPhoto.jpg");
    myImage.className = "myImg";
    imagesContainer.appendChild(myImage);

    aboutUsSection.appendChild(imagesContainer);

    return aboutUsSection;
  }

  function createOurServicesSection() {
    const ourServicesSection = createSection(
      "Our Services",
      `At Virtual Currencies World, we are dedicated to providing you with real-time and up-to-date exchange rates for various currencies. As a specialized platform focused solely on delivering the latest rates, we aim to be your go-to resource for tracking the value of your favorite digital assets. \nOur mission is simple  to provide a fast, reliable, and user-friendly service that allows you to monitor currency exchange rates easily. We understand the importance of staying informed in the dynamic world of virtual currencies, and our website is designed to help you make well-informed decisions.
      What We Offer:\n
      1.	Real-Time Exchange Rates: Our website displays the current exchange rates for a wide range of currencies. We ensure that the rates are updated in real-time, so you always have the most accurate information at your fingertips.
      2.	Simple and Intuitive Interface: We believe that accessing exchange rate information should be straightforward. Our website features a clean and intuitive interface that allows you to find the rates you need quickly and effortlessly.
      3.	Mobile-Friendly Design: Stay connected to the currency market on the go. Our website is optimized for mobile devices, ensuring that you can access the latest exchange rates anytime, anywhere.\n
      Thank you for choosing Virtual Currencies World, and we look forward to providing you with valuable exchange rate information for your currency endeavors. Stay updated, stay informed, and welcome to the simplicity journey of tracking virtual currencies!`
    );

    return ourServicesSection;
  }

  function createContactUsSection() {
    const contactUsSection = createSection(
      "Contact Us",
      `For any inquiries:
      \n🤵Kfir aroyo 
      \n📧 kfiroyo89@gmail.com
      \n💬 https://wa.me/0526242994
      \n📱 052-6242994`
    );

    return contactUsSection;
  }

  function displayAbout() {
    hideSearchSection();
    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = "";
    const aboutUsSection = createAboutUsSection();
    mainContent.appendChild(aboutUsSection);

    const ourServicesSection = createOurServicesSection();
    mainContent.appendChild(ourServicesSection);

    const contactUsSection = createContactUsSection();
    mainContent.appendChild(contactUsSection);
  }

  function showSearchSection() {
    const searchSection = document.querySelector(".search-section");
    searchSection.style.display = "block";
  }

  function hideSearchSection() {
    const searchSection = document.querySelector(".search-section");
    searchSection.style.display = "none";
  }

  function drawMainMessage(mainContent, msg) {
    mainContent.innerHTML = "";
    const newSection = createSection(msg, "");

    mainContent.appendChild(newSection);
  }
})();

function displayCoinData(data, cardId, targetId) {
  const container = document.getElementById(`collapse-content-${cardId}`);
  container.innerHTML = "";

  var usdValue = data.market_data.current_price.usd;
  var eurValue = data.market_data.current_price.eur;
  var ilsValue = data.market_data.current_price.ils;

  var p = document.createElement("p");
  p.innerText = `Value in USD: $${usdValue}`;
  container.appendChild(p);

  p = document.createElement("p");
  p.innerText = `Value in EUR: €${eurValue}`;
  container.appendChild(p);

  p = document.createElement("p");
  p.innerText = `Value in ILS: ₪${ilsValue}`;
  container.appendChild(p);

  $(targetId).collapse("toggle");
}
