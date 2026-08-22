<script>
import 'bootstrap'
import { fetchRates } from '@/api/rates.js'

export default {
  data: function () {
    return {
      groups: [],
      selectedSlug: null,
      loading: true,
      stale: false,
      loadError: null,
      value: 1000,
      term: 1,
      limit: false,
      result: {
        willCharge: 0,
        willReceive: 0,
        portion: 0
      }
    }
  },
  async mounted() {
    const { groups, stale, error } = await fetchRates()

    this.groups = groups
    this.stale = stale
    this.loadError = groups.length === 0 ? error : null
    this.selectedSlug = groups[0]?.slug ?? null
    this.loading = false

    if (this.selectedSlug) this.process()
  },
  computed: {
    selectedGroup: function () {
      return this.groups.find((group) => group.slug === this.selectedSlug) ?? null
    },
    rateMap: function () {
      const rates = this.selectedGroup?.rates ?? []
      return new Map(rates.map((rate) => [rate.installments, rate]))
    },
    maxTerm: function () {
      return this.selectedGroup?.maxInstallments ?? 1
    },
    ready: function () {
      return !this.loading && this.rateMap.size > 0
    }
  },
  methods: {
    process: function () {
      this.term = Math.min(Number(this.term), this.maxTerm)

      const rate = this.rateMap.get(Number(this.term))
      if (!rate) return

      if (this.limit) {
        this.result = {
          willCharge: this.formatter(this.value),
          willReceive: this.formatter(this.value - (this.value * rate.limitFactor)),
          portion: this.formatter(this.value / this.term)
        }
      } else {
        this.result = {
          willCharge: this.formatter(this.value * rate.coefficient),
          willReceive: this.formatter(this.value),
          portion: this.formatter((this.value * rate.coefficient) / this.term)
        }
      }
    },
    formatter: function (e) {
      return Number(e).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      })
    },
    copy: function () {
      let flag = this.selectedGroup?.name ?? ''
      let e = `Simulador NexoraCred
Bandeiras consideradas: ${flag}
Será cobrado no cartão: ${this.result.willCharge}.
Você receberá: ${this.result.willReceive}.
Ser${this.term > 1 ? "ão" : "á"} ${this.term} parcela${this.term > 1 ? "s" : ""} de ${this.result.portion}`

      navigator.clipboard.writeText(e)
    }
  }
}
</script>

<template>
  <div class="text-bg-dark">
    <div class="col-6 offset-3">
      <div class="col-4 offset-4 pt-5">
        <img alt="Logo" class="img-fluid" src="../img/logo.png">
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Carregando taxas...</span>
        </div>
        <p class="text-secondary mt-3 mb-0">Carregando taxas...</p>
      </div>

      <div v-else-if="!ready" class="alert alert-danger my-5" role="alert">
        <h2 class="h5 alert-heading">Taxas indisponíveis</h2>
        <p class="mb-0">
          Não foi possível carregar as taxas do servidor, e não há cópia local para usar.
          Sem elas a simulação não pode ser feita.
        </p>
        <hr>
        <p class="small mb-0">Detalhe técnico: {{ loadError }}</p>
      </div>

      <template v-else>
        <div v-if="stale" class="alert alert-warning py-2 small mt-4" role="alert">
          Servidor indisponível — as taxas exibidas vêm da última consulta e podem estar
          desatualizadas.
        </div>

        <div class="mb-3">
          <label class="form-label" for="value">Valor: </label>
          <input type="number" id="value" class="form-control" v-model="value" @change="process">
        </div>

        <div class="col-12">
          <label class="form-label" for="term">Número de parcelas: </label>
          <input type="range" id="term" class="form-range" min="1" :max="maxTerm" v-model="term" @change="process">
          <h2 class="text-center">{{ term }}</h2>
        </div>

        <div class="mb-3">
          <label class="form-label" for="cardGroup">Bandeira do cartão: </label>
          <select class="form-select" id="cardGroup" v-model="selectedSlug" @change="process">
            <option v-for="group in groups" :key="group.slug" :value="group.slug">
              {{ group.name }}
            </option>
          </select>
        </div>

        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" role="switch" id="limit" v-model="limit" @change="process">
          <label class="form-check-label" for="limit">
            Calcular {{ limit ? "a partir do limite" : "valor à receber" }}
          </label>
        </div>

        <div class="jumbotron">
          <h1 class="display-6">Detalhes da simulação</h1>
          <p class="lead">Bandeiras consideradas: {{ selectedGroup.name }}</p>
          <p class="lead">Será cobrado no cartão: {{ result.willCharge }}</p>
          <p class="lead">Você receberá: {{ result.willReceive }}</p>
          <hr class="my-4">
          <p>
            Ser{{ parseInt(term) === 1 ? "á" : "ão" }}
            {{ term }}
            parcela{{ parseInt(term) === 1 ? "" : "s" }}
            de {{ result.portion }}
          </p>
        </div>

        <p class="lead">
          <a class="btn btn-outline-primary btn-lg" role="button" @click="copy">Copiar</a>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
</style>
