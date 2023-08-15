
if (PDP1Engine) {
	PDP1Engine.load( {
		'id': 'snowflake',
		'versionString': 'Arlasofts PDP-1 Game',
		'displayLabel': 'Arlasofts PDP-1 Game',
		'startAddress': -1,       // get it from tape
		'endOfMainLoop': 0170,   // location of jump to ml0
		'endOfScorerLoop': 03066, // end of scorer loop
		'splashScreen': false,
		'useHwMulDiv': true,
		'hiRes': true,
		'hasParams': true,
		'senseSwitchLabels': {
			'2': ['Ptolemaic View', 'On: Needle\'s ego view, Off: normal display', 'Ptolemaic Ego View' ],
			'3': ['Torpedoes', 'On: single shot, Off: salvoes', 'Single Shot Mode' ]
		},
		'message': [
			'@@@ Spacewar 2015 @@@',
			'Featuring the Minskytron hyperspace, a score display',
			' (press {scorer}), and a Ptolemaic ego view (sense switch 2).',
			'Proudly presented by N. Landsteiner, 2015.','(Not an authentic program.)'],
		'tapes': ['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmr+pu4CCmr+qmr+wmr+riL+wmr+smr++mr+tu4CCmr+umr+/mr+vu4CCmr+wgICAmr+xkb+wmr+yoL++mr+zlL++mr+0pL+wmr+1qr+/mr+2sL+vmr+3kL++mr+4oL+/mr+5u4CCmr+6mr++mr+7qr++mr+8voSAmr+9sL+psL+pAAAAAACagIOagYCwgIWwgLu6gISSgIKQgIC6gKyxgIGAgICAgICAgIC/v6eAgICAgICAgICAgICAgICAgICAgICAgIGAgIGAgIGAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOAgIGAgIGAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoZOUgKiUgJ+wgZaQoZSUgI2goZWUgI6QoZatirgAAAAAAJqBgJqBt5SAjJChl5SAj5Chk5SAm5SAo5SAn7iEj5aEgoiEgqChmJSAoZChmaKhlZSAnJChmpSAqJChm5SAr5ChnJSAmbCBuJChnZSAjJSAj5ChmpSAlZSAlpChnpSAjZChn5SAoZChmpSAopSAl5Chk5SAmJSAo5SAsZSAspSAs5SAtZSAtpSAtJSAm5SAn7iEj5aEgoiEgqChmJSAoZChmaKhlZSAnLCBuLWmgQAAAAAAmoG4moKAkqGgmqSKkICotIGAsIKNsoqksoq8so2zq7CvAAAAAACagoCag4CygreyhZSyipiyirCyjJiyi6qyg5Wyhb+ygqiyhK2yg6CyhoqwgqSyi6qkgJm0gYCwgp6yjbOQoZOUgJqQoaGUgJmQgJ20gYCwgLeQoZqUgJqQgJ60gYCwgLekgK+0gYCwgqSQoZuUgK+yh5SkgJCmpIqwgqWwgbiWjLuQgJW0gYCwjLu4j42WjLO4j5GWjK64gJGWjLS4gJOWjLC4oaKWjLmwjK6Wg5GQgJ2GoZq0gYCwg5GQgJWGoZq0gYCwg5GWracAAAAAAJqDgJqEgJCAl7SBgLCDhpChmpSAl7CDiJChk5SAl5CAlaKhmpSAlZCAjKCho5SAk5CAjaChpJSAkbCDkZaDlKSAlbCDlJaDn5CAlbSBgLCDn5CAk6ChlZSAk6KhmbSEgLKDkrCDn5aEiJCAlbSBgLCEiJCAm6ChpaCho5SApJCAkaChpZSApZCAnKChpaCho5SAppCAk6ChpZSAp5CApKKApaChprSCgLCEiKKhp7SEgLCEiJCApqKAp6Cho7SCgLCEiKKhqIaNhAAAAAAAmoSAmoWAtISAsISIkICAgISDsoaxkKGalICVsomasISIkKGZoqGVlICcuISPloSCsIeQgICCgICDgICDgICDgICEgICEgICEgICFgICFgICFgICFgICGgICGgICGgICGgICHgICHgICHgICHgICIgICIgICIgICIgICJgICJgICKgICKgICKgICKgICKloy7kICWtIGAsIy7uI+NloyzuI+RloyuuICSloy0uICUloywuKGiloy5sIyuloWTkICOoKGllICkg7GWAAAAAACahYCahoCQgJugoaWUgKWQgIqUgIu3iIGGoamgoamUgIqCoaqggKSigKWgoauioay0goCwhZOioay0goCwhaawhZOWhbuQgJq0gYCwhaKQgIqUgIu3iIGGoamgoamUgIqCoa2ioa60goCyhLyQgJ6GoZq0gYCwhbuQgJaGoZq0gYCwhbuQgJi0gYCwhbCQoZqUgJiwhbKQoZOUgJeQgJaioZqUgJaQgI+goaOUgJSQgI6goaSUgJKwhbuWhb6kgJawhb6Whom/mZEAAAAAAJqGgJqHgJCAlrSBgLCGiZCAlKChlZSAlKKhmbSEgLKFvLCGiZaGsJCAlrSBgLCGsJCAm6ChpaCho5SApJCAkqChpZSApZCAnKChpaCho5SAppCAlKChpZSAp5CApKKApaChprSCgLCGsKKhp7SEgLCGsJCApqKAp6Cho7SCgLCGsKKhqLSEgLCGsLKGsZChmpSAlrKJubCGsJaHk5CAipSAi7eIgYahqaChqZSAioKhmpSAopCAipSAi7eIgYahqaChqZSAio+uiAAAAAAAmoeAmoiAgqGvoqGwlICbkICcoqGxtISAsISJkICcoKGylICckISCoqGzlISCkICjoqGzlICjiISCoKGYlIChsIeTlomFkKGolICukKG0lICtuKCJtp+/tp+/kKG1lICpkKG2lICqsomGkKG0lICtuKCWtp+/tp+/kKG3lICqkKG1lICpsomGkKG4lICtuKCjtp+/tp+/kKG5lICqkKG6lICpsomGkKG4lICtuKCptp+/tp+/kKGWlICqkKG7lICpsomGkKGWoqq1AAAAAACaiICaiYCUgKqQobyUgKmQoZqUgKuyjY2QobiUgK24gLG2n7+2n7+QoZaUgKqQob2UgK2Qob6UgKmyiYaQobiUgK24oKm2n7+2n7+QoZeUgKqQobuUgKmyiYaQoZeUgKqQobyUgKmQob+UgKuyjY2QobiUgK24gLS2n7+2n7+QoZeUgKqQob2UgK2Qob6UgKmyiYa4oK+2n7+2n7+QooCUgKqQooGUgK2QooKUgKmyiYa4oYG2n7+2n7+QooOUgKqQooGUgK2viL0AAAAAAJqJgJqKgJCigpSAqbKJhrKKmLKKsLCJhZaJmbafv7afv5aJipCAgICJi5SAq6KihLSBgLCJkbCJkrKNjZCAqaCArpSAqaSJiqSArbSBgLCJirCJmZaJuJChk5SAsJCAs6CAsKChmpSAs6KihbSCgLCJqJCAs6KihZSAs6SAsJCAsqCAsJSAspChk5SAsJCAsqKihbSCgLCJtZCAsqKihZSAsqSAsJCAsaCAsJSAsbCJuJaKl5Chk5SAsJCAtqCAsKChmpSAtrSRqwAAAAAAmoqAmouAoqKFtIKAsIqHkIC2oqKFlIC2pICwkIC1oICwlIC1kKGTlICwkIC1oqKFtIKAsIqUkIC1oqKFlIC1pICwkIC0oICwlIC0sIqXloy7uI6RloyzuI6gloyuuICNloy0uICMloywuKKGloy5sIyuloqvkICXtIGAsIqskICNoqG/lICNsIqvkICNoKG/lICNsIqvloy7uI6+loyzuI6vloyuuICOloy0uICPloywuKKHloy5sIyulouHkICYtIGAsIuEoKicAAAAAACai4CajICQgI6iob+UgI6wi4eQgI6gob+UgI6wi4eQgKi0gYCwi5uQoZqUgKiwgLuWi5uQgJyiooiUgJykgKOQgKOioom0hICwi4ikhIKIhIKgoZiUgKGwi5uWi6KQoZOUgKKQooqUgJuyi46wi6KWi6mQoZqUgKKQoouUgJuyi46wi6mWjLuQgKK0gYCwi7WQgJuigKGUgJuioou0goCyi6Owi7uQgJuggKGUgJuiooq0hICyi5ykgKC0jL6wjIOQooyUgKCXjLgAAAAAAJqMgJqNgJCAn4ahmpSAn5CAn7SBgLCMjbiPlZaMs7iPupaMrriijZaMubCMk7iQn5aMs7iRhJaMrriijpaMubiAm5aMtLiAnJaMsLCMrpaMu5CAkIKhrrSBgLCMu7iOkZaMs7iOkZaMrpCAipSAi7eIgYahqaChqZSAiriAi5aMtLiAipaMsLiij5aMubCMrpCAgICMr6CMsLe/v7e4gZCMs6CMtLarv7qAh6SMrqSMs6qMubCMrrCMu5CAgICMvaCAqre/v7+IkQAAAAAAmo2Amo6At7iBpI2DpIy8kI2DoICptqu/uoCHpIy8pI2DpICstIGAsIy8sI2Mlo2MuJS7oICrlo2UuJWhoICrlo2XkI2Ulo2Dloy8kI2XvoiAlICssIy8lo2gkKKKlICNkKGTlICXsI2glo2mkKKLlICNkKGalICXsI2mlo2skKKKlICOkKGTlICYsI2slo2ykKKLlICOkKGalICYsI2ylo6QvqCAuoCJvoKAtpCDtJCAoKGalICevoKAtpCBtJCAoKGalICdn66uAAAAAACajoCaj4CQgI2iooq0hICyjZuQgI2ioou0goCyjaGQgI6iooq0hICyjaeQgI6ioou0goCyja2wjpCAgICAgICAgISAgIyAgJiAgKCAgKiAgLSAgLyAgYCAgYCAgLSAgKiAgJiAgIyAgICAgImAgJKAgJiAgJuAgKGAgJuAgJiAgJKAgImAgICAgICAgICAgICAgICAgICAgImAgJKAgJiAgKGAgJiAgJKAgImAgICAgIOAgImAgImAgImAgIOAgIOAgICAgIaIhJkAAAAAAJqPgJqQgICAjICAkoCAlYCAmICAnoCApICAqoCAoYCAm4CAlYCAj4CAiYCAlYCAgICAg4CAgICAg4CAgICAhYCAi4CAkICAgICAgICAhYCAhYCAioCAioCAioCAkICAloCAnICAooCAqICArYCAhYCAhYCAsoCAsoCAt4CAt4CAsoCAsoCArYCArYCAioCAkICAloCAnICAooCAqICArYCAloCAnICAooCAkICAqICAioCArYCAmICAoICAkICAloCAiICAkLS2kgAAAAAAmpCAmpGAgICcgICcgICcgICcgICcgICcgICcgICAgICAgICAgICAgICYgICggICQgICWgICIgICQgICQgICQgICQgICQgICQgICQgICQgICWgICWgICWgICigICigICogICogICAgICAgICFgICFgICKgICKgICKgICQgICWgICcgICigICogICtgICQgICWgICigICogIC3gIC3gICygICygICtgICtgICKgICQgICWgICcgICigICogICtgICWgICcgICitLmUAAAAAACakYCakoCAgJCAgKiAgIqAgK2AgIiAgJCAgJCAgJaAgIiAgJCAgJyAgJyAgJyAgJyAgJyAgJyAgJyAgICAgICAgICAgICAgIiAgJCAgJCAgJaAgIiAgJCAgJCAgJCAgJCAgJCAgJCAgJCAgJCAgJaAgJaAgJaAgKKAgKKAgKiAgKiAgKiAgICAgLCAgIiAgKiAgIiAgKCAgIiAgJiAgIiAgJCAgIiAgIiAgIiAgICAgIiAgLCAgICAgLCAgIiAgKiAgJCAgKC0tq0AAAAAAJqSgJqTgICAkICAmICAiICAkICAgICAiICAgICAgICAkICAgICAiICAgICAgICAsICAgICAsICAiICAqICAkICAoICAkICAmICAgICAmICAiICAkICAkICAiICAkICAgICAiICAgICAgICAsICAgICAqICAgICAoICAgICAmICAgICAmICAiICAsICAkICAqICAkICAoICAkICAmICAkICAkICAkICAiICAkICAgICAkICAsICAkICAsICAiICAsICAgICAqLS2gAAAAAAAmpOAmpSAgICAgICggICAgICYgICAgICYgICIgICQgICQgICIgICQgICAgICIgICAgICAgICYgICIgICogICQgICwgICIgICogICAgICggICAgICYgICAgICQgICQgICQgICAgICIgICQgICIgICAgICAgICIgICwgICIgICogICQgICogICAgICggICQgICggICAgICYgICIgICQgICQgICQgICAgICIgICQgICIgICAgICAgICIgICwgICAgICwgICIgICwtLaYAAAAAACalICalYCAgJCAgKiAgJCAgKCAgJCAgJiAgIiAgJCAgIiAgIiAgIiAgICAgIiAgLCAgIiAgKiAgJCAgKiAgICAgKCAgJCAgKCAgICAgJiAgJCAgJiAgICAgJCAgJCAgJCAgICAgIiAgJCAgIiAgICAgICAgIiAgLCAgIiAgKiAgICAgKCAgICAgJiAgIiAgKiAgJCAgKCAgJCAgJiAgJCAgJCAgJCAgIiAgJCAgICAgIiAgICAgICAlI2AkamAkbmAko2AkqG2lJUAAAAAAJqVgJqWgICSuYCTj4CTu4CTpYCUpYCWh4CWo4CWv4CXkYCXrYCYhYCYmYCYsYCZj4CZpYCZt4Cak4CapYCbg4Cbn4Cbt4CcjYCco4Ccv4CdkYCdo4CdvYCelYCes4CfjYCfoYCft4CfvYCAjICAiICAioCAioCAjICAi4CAi4CAiYCAi4CAi4CAjoCAjoCAiYCAjoCAjICAioCAjICAj4CAi4CAiYCAjoCAiYCAj4CAjoCAjICAi4CAi4CAjoCAiYCAiYCAjYKMrgAAAAAAmpaAmpeAgICMgICPgICNgICKgICLgICDgICGgICYgICIgICAgICQgICIgICQgICQgICQgICYgICQgICggICQgICogICQgICwgICIgICogICAgICggICAgICYgICAgICQgICAgICIgICAgICAgICAgICYgICIgICAgICIgICIgICQgICQgICQgICggICQgICogICQgICwgICIgICwgICAgICogICAgICggICAgICYgICAgICQgICAgICIgICAgICAgICAgICwtLyGAAAAAACal4CamICAgJCAgLCAgIiAgKiAgICAgKCAgICAgJiAgICAgJCAgICAgIiAgICAgICAgJCAgICAgIiAgIiAgICAgJCAgICAgJiAgICAgKCAgICAgKiAgICAgLCAgICAgLCAgIiAgKiAgJCAgKCAgJCAgJiAgJCAgJCAgJCAgIiAgJCAgICAgIiAgICAgICAgLCAgJCAgLCAgIiAgLCAgICAgKiAgICAgKCAgICAgJiAgIiAgJiAgICAgJCAgICAgIiAgICAgIC0vogAAAAAAJqYgJqZgICAkICAgICAiICAgICAgICAsICAkICAsICAiICAsICAgICAqICAgICAoICAgICAmICAiICAmICAgICAkICAgICAiICAgICAgICAgICAsICAkICAsICAiICAqICAgICAoICAgICAmICAgICAkICAgICAiICAgICAmICAkICAkICAkICAiICAkICAgICAkICAgICAiICAsICAkICAsICAgICAqICAkICAqICAgICAoICAkICAoICAgICAmICAkICAmLWBoAAAAAAAmpmAmpqAgICIgICYgICAgICQgICQgICQgICAgICIgICQgICIgICAgICAgICQgICAgICAgICwgICQgICwgICIgICwgICAgICogICIgICggICIgICYgICIgICQgICIgICIgICIgICAgICQgICAgICIgICAgICAgICwgICQgICwgICIgICwgICAgICogICIgICggICIgICYgICIgICQgICIgICIgICIgICAgICAgICQgICQgICIgICQgICAgICQgICogICQgICwtYKYAAAAAACamoCam4CAgJCAgKCAgIiAgJiAgIiAgLCAgICAgKiAgICAgKCAgICAgJiAgICAgJCAgICAgIiAgICAgICAgICAgICAgJCAgICAgIiAgLCAgICAgKiAgICAgKCAgICAgJiAgICAgJCAgICAgIiAgICAgICAgICAgKiAgIiAgLCAgJCAgKiAgJCAgKCAgJCAgJiAgJCAgJCAgJCAgIiAgJCAgICAgJCAgLCAgICAgKiAgICAgKCAgICAgJiAgICAgJCAgICAgIi1g7AAAAAAAJqbgJqcgICAgICAgICAgICAsICAiICAqICAkICAoICAkICAmICAkICAkICAkICAiICAkICAgICAkICAsICAgICAqICAgICAoICAgICAmICAgICAkICAgICAiICAgICAgICAgICAsICAiICAqICAkICAqICAgICAoICAkICAoICAgICAmICAkICAmICAgICAkICAkICAkICAgICAiICAkICAiICAgICAgICAiICAmICAiICAoICAkICAqICAkICAsICAiICAsLWHqAAAAAAAmpyAmp2AgICAgICogICAgICggICAgICYgICAgICQgICAgICIgICAgICAgICAgICwgICIgICogICQgICogICAgICggICQgICggICAgICYgICQgICYgICAgICQgICQgICQgICAgICIgICIgICAgICQgICYgICIgICwgICIgICogICQgICggICQgICQgICQgICIgICQgICAgICQgICwgICAgICogICAgICggICAgICYgICAgICQgICAgICIgICAgICAgICAgICwtYiQAAAAAACanYCanoCAgIiAgKiAgJCAgKiAgICAgKCAgICAgJiAgIiAgJCAgJCAgIiAgJCAgIiAgICAgICAgIiAgLCAgJCAgLCAgICAgLCAgIiAgKiAgIiAgKCAgIiAgJiAgIiAgJCAgIiAgIiAgIiAgICAgIiAgICAgIiAgLCAgJCAgKiAgJCAgKCAgJCAgJiAgJCAgJCAgJCAgIiAgJCAgLCAgICAgKiAgICAgKCAgICAgJiAgICAgJCAgICAgIiAgICAgLCAgJCAgKi1jKAAAAAAAJqegJqfgICAkICAoICAkICAmICAkICAkICAkICAsICAgICAqICAgICAoICAgICAmICAgICAkICAgICAiICAiICAgICAiICAgICAkICAgICAgICAiICAiICAsICAkICAqICAkICAoICAkICAmICAkICAkICAkICAiICAkICAsICAgICAqICAgICAoICAgICAmICAgICAkICAgICAiICAgICAmICAiICAsICAkICAqICAkICAoICAkICAkICAkICAiICAkICAgLWNkAAAAAAAmp+AmqCAgICQgICwgICAgICogICAgICggICAgICQgICAgICIgICAgICAgICAgICwgICQgICogICQgICggICQgICwgICAgICogICAgICggICAgICYgICIgICQgICIgICIgICIgICAgICIgICwgICAgICwgICIgICwgICQgICogICQgICggICQgICYgICIgICQgICAgICIgICAgICAgICQgICAgICIgICAgICAgICYgICQgICYgICIgICYgICAgICggICQgICgtY+gAAAAAACaoICaoYCAgIiAgKCAgICAgJCAgJCAgJCAgIiAgJCAgICAgIGAgJeAgJ+AgIqAgI2AgI6AgJuAgLKAgJmAgI2AgJmAgKSAgIGAgIqAgJuAgJWAgIqAgJyAgJiAgI+AgJ2AgLKAgIKAgICAgIKAgIOAgJyAgIyAgJiAgJuAgI6AgJyAgJmAgJWAgIqAgKKAgI6AgJuAgKOAgKWAgJmAgIGAgLKAgI+AgJKAgJuAgI6AgLKAgLKAgIGAgJmAgLKAgJCAgIqAgJa1laAAAAAAAJqhgJqigICAjoCAloCApYCAmYCAgoCAsoCAj4CAkoCAm4CAjoCAsoCAsoCAgoCAmYCAsoCAkICAioCAloCAjoCAgL+5v4CAiL+/l7+9v4CAhICHmICAgb+/uL++v7+4kL++qYCAhb+/ur+/vpCPkYCAmICAnoCQgICAn4CAv4CAsJ2uuICBv4CCloCErICDv4CAjYCPv4CHv4CFqICBtYCAg7+/sr+7p4CGgICEgL+/uYCBgL++h7+8n4CBmL+/vICDoICAgqSCrAAAAAAAmqKAmqKQv7q/v7+tv7mfv7mXgICygICKkI6gkI+NgICngICbgIa4v7iHt7+/kI+6kJGEkI6Svb+yAAAAAACwgIQA']});}