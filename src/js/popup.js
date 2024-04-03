class Popup {
    constructor() {
        this._currencyCodes = ['USD', 'EUR', 'GBP', 'CHF', 'PLN', 'RUB'];
        this._url = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json&date=';
        this.onLoad();
    }

    onLoad() {
        const currentDate = this.getCurrentDate();
        this._dateField = document.getElementById('date');
        this._dateField.value = currentDate;
        this._dateField.setAttribute('max', currentDate);
        this._dateField.onchange = () => {
            if (this._dateField.value && this._dateField.validity.valid) {
                this.showRates(this._dateField.value);
            } else {
                this._tableContainer.innerHTML = '';
                this._dateTooltip.innerHTML = 'Select Date';
            }
        };
        this._dateField.onfocus = () => {
            this._dateField.type = 'date';
        };
        this._dateField.onblur = () => {
            if (!this._dateField.value) {
                this._dateField.type = 'text';
            }
        };

        this._dateTooltip = document.getElementById('date-tooltip');
        this._tableContainer = document.getElementById('rates-container');
        this._loader = document.getElementById('loader');
        this.showRates(currentDate);
    };

    getCurrentDate() {
        const now = moment();
        return now.format('YYYY-MM-DD');
    }

    async getRates(date) {
        date = date.replace(/-/g, '');
        const url = this._url + date;
        try {
            let response = await fetch(url);
            if (response.ok) {
                let jsonResponse = await response.json();
                const rates = jsonResponse.filter(currency => this._currencyCodes.includes(currency.cc));
                // Some tricky code to sort currencies in needed order
                let result = [];
                this._currencyCodes.forEach(currencyCode => {
                    let value = rates.find(rate => rate.cc === currencyCode);
                    if (typeof value !== 'undefined') {
                        result.push(value);
                    }
                });
                return { error: false, rates: result };
            }
        } catch (error) {
            return { error: true, err: error };
        }
    }

    showRates(date) {
        this.addDateTooltip(date);
        this.showLoader();
        this.getRates(date).then(result => {
            if (result.error === false) {
                if (result.rates.length) {
                    this.createTable(result.rates);
                } else {
                    this.showNoData();
                }
            } else {
                this.showError(result.err);
            }
            this.hideLoader();
        });
    }

    showError(error) {
        const defaultMessage = ':( Oops... An Error Occurred';
        this._tableContainer.innerHTML = `
        <div class="error" id="error-container">
            <i class="material-icons">error</i>
            <span>${typeof error.message !== 'undefined' ? error.message : defaultMessage}</span>
        </div>
        `;
    }

    addDateTooltip(date) {
        date = moment(date, 'YYYY-MM-DD');
        this._dateTooltip.innerHTML = date.format('Do MMMM[,] YYYY');
    }

    createTable(rates) {
        this._tableContainer.innerHTML = `
        <table class="mdl-data-table mdl-js-data-table table" id="rates">
            <thead>
                <tr>
                    <th class="mdl-data-table__cell--non-numeric mdl-color--grey-100">Currency</th>
                    <th class="mdl-color-text--primary mdl-color--grey-100">Rate (UAH)</th>
                </tr>
            </thead>
            <tbody>
                ${rates.map(rate => `
                <tr>
                    <td class="mdl-data-table__cell--non-numeric">${rate.cc}</td>
                    <td class="rate mdl-color-text--primary">${rate.rate.toFixed(4)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="footer mdl-color-text--primary">
            <span>Using <a class="mdl-color-text--primary-dark" href="https://bank.gov.ua/ua/open-data/api-dev" target="_blank">National Bank of Ukraine</a> API</span>
        </div>
        `;
    }

    showNoData() {
        this._tableContainer.innerHTML = `
        <div class="error" id="error-container">
            <i class="material-icons">warning</i>
            <span>No Available Data</span>
        </div>
        `;
    }

    showLoader() {
        this._loader.style.visibility = 'visible';
    }

    hideLoader() {
        this._loader.style.visibility = 'hidden';
    }
}

document.addEventListener('DOMContentLoaded', function(){
    const popup = new Popup();
});