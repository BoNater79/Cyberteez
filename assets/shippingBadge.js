document.addEventListener('DOMContentLoaded', function () {

	const getCookie = (name) => {
		let matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
		));
		return matches ? decodeURIComponent(matches[1]) : undefined;
	}

	const setCookie = (name, value, options = {}) => {

		options = {
			path: '/',
			...options
		};

		if (options.expires instanceof Date) {
			options.expires = options.expires.toUTCString();
		}

		let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

		for (let optionKey in options) {
			updatedCookie += "; " + optionKey;
			let optionValue = options[optionKey];
			if (optionValue !== true) {
				updatedCookie += "=" + optionValue;
			}
		}

		document.cookie = updatedCookie;
	}


	const isCountry = (countries = []) => {
		if (typeof window.Shopify.AdminBarInjector !== 'undefined' || typeof window.Shopify.PreviewBarInjector !== 'undefined') {
			return new Promise((resolve) => {
				resolve(true)
			})
		}
		const KEY = `is_country_${countries.join('_')}`
		const saved = getCookie(KEY)
		if (saved !== undefined) {
			return new Promise((resolve) => {
				resolve(saved == 'true')
			})
		}
		return fetch('https://ipapi.co/country')
			.then((res) => res.text())
			.then((res) => {
				const is = countries.includes(res)
				setCookie(KEY, is)
				return is
			})
			.catch(() => {
				return true
			})
	}

	

	const weeks = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

	const addBusinessDays = (date, numDays = 0, holidays = []) => {
		while (numDays--) {
			while (true) {
				date.setDate(date.getDate() + 1)
				let weekday = date.getDay();
				let dateFormat = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2)
				if (weekday > 0 && weekday < 6 && !holidays.includes(dateFormat)) break;
			}
		}
		return date
	}

	isCountry(['US'])
		.then((isRender) => {
			if (!isRender) {
				return
			}

			const wrap = document.body.querySelector('.shippingBadge-wrap')

			if (!wrap) {
				return
			}

			wrap.classList.remove('shippingBadge-wrap-hidden')

			const arrivesBy = document.body.querySelector('.shippingBadge-arrives-by span');


			if (!!arrivesBy) {
				const processingTime = arrivesBy.getAttribute('data-processing-time')
				const holidays = arrivesBy.getAttribute('data-holidays').split(',')
				const date = addBusinessDays(new Date(), ~~processingTime, holidays)

				arrivesBy.innerHTML = weeks[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + ('0' + date.getDate()).slice(-2)
			}


			let fsb_user_time = getCookie('shippingBadge_user_time');

			if (typeof fsb_user_time === 'undefined') {
				fsb_user_time = 3600 * 2
				setCookie('shippingBadge_user_time', fsb_user_time, {
					'Max-Age': 3600 * 2
				})
			}


			let date_now = Date.now().toString()
			date_now = date_now.substring(0, date_now.length - 3)

			let total_seconds = parseInt(fsb_user_time) - parseInt(date_now);

			let hours = 0;
			let minutes = 0;
			let seconds = 0;

			let elem_time = document.body.querySelector('.shippingBadge-time');

			setInterval(() => {

				if (total_seconds <= 0) {

					total_seconds = 3600 * 2;

					setCookie('shippingBadge_user_time', 3600 * 2, {
						'Max-Age': 3600 * 2
					})
				}

				hours = Math.floor(total_seconds / 3600);

				minutes = Math.floor(((total_seconds - 3600 * hours) - (total_seconds - 3600 * hours) % 60) / 60);

				seconds = total_seconds % 60;

				total_seconds -= 1;

				const _hours = hours > 0 ? hours.toString() + (hours === 1 ? ' hour' : ' hours') : ''
				const _mins = minutes.toString() + (minutes === 1 ? ' min' : ' mins')

				elem_time.innerHTML = _hours + ' ' + _mins;

			}, 1000)

		})
	
})