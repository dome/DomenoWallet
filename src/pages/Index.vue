/***
 * 首页面，空白内容，显示loading
 */

<template>
  <div class="page">
    <img src="../assets/img/logo-blank.png" alt="firefly" class="logo"/>
  </div>
</template>

<script>
export default {

}
</script>

<style lang="stylus" scoped>
@require '~@/stylus/color.styl'
.page
  position: fixed
  top: 0
  bottom: 0
  left: 0
  right: 0
  height: 100%
  background: $primarycolor.background
  text-align: center
  vertical-align:middle
  padding-top: 45%
  .logo
    width: 156px
    height:156px


</style>
