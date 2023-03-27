const a = {
  property1: '我是谁',
  func: () => {
    console.error('console.error(123)')
    const b = 3
    alert(1231)
  },
  obj: {
    func: hello => {
      console['error'](`${console.error(hello)}`)
      const b = `${console.error(1)}`
      alert(1231)
    }
  }
}